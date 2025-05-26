// Este arquivo é usado para configurar um proxy de API local durante o desenvolvimento
// para contornar limitações de CORS e segurança em requisições diretas do navegador
// para o SQL Server

import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
const envPath = path.resolve(__dirname, '../../.env');
console.log(`Tentando carregar variáveis de ambiente de: ${envPath}`);
dotenv.config({ path: envPath });

// Verificar se as variáveis essenciais foram carregadas
if (!process.env.DB_SERVER || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error("ERRO CRÍTICO: Variáveis de ambiente do banco de dados não encontradas!");
  console.error("Verifique se o arquivo .env existe e contém DB_SERVER, DB_USER e DB_PASSWORD.");
  console.error(`Caminho do .env buscado: ${envPath}`);
}

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Configurações do banco de dados
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000, // Aumentar timeout para 30 segundos (de 15000ms para 30000ms)
    requestTimeout: 30000, // Timeout para requisições
    pool: {
      max: 10, // Máximo de conexões no pool
      min: 0, // Mínimo de conexões no pool
      idleTimeoutMillis: 30000 // Tempo máximo de inatividade
    }
  }
};

// Logs detalhados para depuração
console.log('========= CONFIGURAÇÃO DO SERVIDOR =========');
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Configuração SQL:');
console.log('- Servidor:', process.env.DB_SERVER);
console.log('- Porta:', process.env.DB_PORT);
console.log('- Usuário:', process.env.DB_USER);
console.log('- Banco de dados:', process.env.DB_DATABASE);
console.log('- Senha configurada:', process.env.DB_PASSWORD ? 'Sim' : 'Não');
console.log('- Comprimento da senha:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('- Porta do API Proxy:', PORT);
console.log('- Timeout de conexão:', config.options.connectTimeout, 'ms');
console.log('=========================================');

// Pool de conexão global para reutilização
let globalPool = null;

// Função auxiliar para conectar ao banco de dados
async function connectToDatabase() {
  console.log('Tentando conectar ao banco de dados...');
  
  // Se já existe uma conexão global, tenta reutilizá-la
  if (globalPool) {
    try {
      // Testar se a conexão ainda está ativa
      await globalPool.request().query('SELECT 1 as ConnectionTest');
      console.log('Reutilizando conexão existente no pool.');
      return globalPool;
    } catch (error) {
      console.log('Conexão existente inválida. Criando nova conexão...');
      globalPool = null; // Resetar a conexão inválida
    }
  }
  
  try {
    // Tentar estabelecer nova conexão
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    globalPool = pool; // Salvar para reutilização
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    return pool;
  } catch (connError) {
    console.error('Erro ao conectar ao banco de dados:', connError);
    throw {
      message: 'Erro ao conectar ao banco de dados',
      error: connError.message,
      config: {
        server: config.server,
        user: config.user,
        database: config.database,
        port: config.port
      }
    };
  }
}

// Middleware para verificar status da conexão
app.use((req, res, next) => {
  res.locals.connectionAttempted = false;
  next();
});

// Endpoint para buscar veículo por placa
app.get('/api/vehicles/:plate', async (req, res) => {
  try {
    const { plate } = req.params;
    console.log(`Buscando veículo com placa: ${plate}`);
    
    // Definir que uma tentativa de conexão foi feita
    res.locals.connectionAttempted = true;
    
    const pool = await connectToDatabase();
    
    console.log('Executando consulta SQL...');
    const result = await pool.request()
      .input('param0', sql.VarChar, plate)
      .query(`
        SELECT 
          v.CodigoMVA,
          v.Placa,
          v.CodigoModelo,
          vm.Descricao AS DescricaoModelo,
          vm.CodigoGrupoVeiculo,
          vg.Letra AS LetraGrupo,
          vg.Descricao AS DescricaoGrupo,
          v.AnoFabricacaoModelo,
          v.Cor,
          v.TipoCombustivel,
          v.NumeroPassageiros,
          v.OdometroAtual,
          v.Status,
          vs.Descricao AS DescricaoStatus,
          v.ValorCompra,
          v.DataCompra
        FROM 
          Veiculos v
        LEFT JOIN 
          VeiculosModelos vm ON v.CodigoModelo = vm.CodigoModelo
        LEFT JOIN
          VeiculosGrupos vg ON vm.CodigoGrupoVeiculo = vg.CodigoGrupo
        LEFT JOIN
          VeiculosStatus vs ON v.Status = vs.Status
        WHERE 
          v.Placa = @param0
      `);
    
    console.log('Consulta SQL executada com sucesso.');
    console.log(`Registros encontrados: ${result.recordset.length}`);
    
    if (result.recordset.length > 0) {
      console.log('Veículo encontrado:', result.recordset[0]);
      res.json(result.recordset[0]);
    } else {
      console.log(`Nenhum veículo encontrado com a placa ${plate}`);
      res.status(404).json({ message: `Nenhum veículo encontrado com a placa ${plate}` });
    }
  } catch (error) {
    console.error('Erro na consulta SQL:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar veículo', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Endpoint para buscar todos os grupos de veículos
app.get('/api/vehicle-groups', async (req, res) => {
  try {
    console.log('Buscando grupos de veículos...');
    
    // Definir dados de fallback para quando a conexão falhar
    const fallbackData = [
      { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
      { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
      { CodigoGrupo: "3", Letra: "B+", Descricao: "Intermediário Plus" },
      { CodigoGrupo: "4", Letra: "C", Descricao: "Intermediário" },
      { CodigoGrupo: "5", Letra: "D", Descricao: "Executivo" },
      { CodigoGrupo: "6", Letra: "E", Descricao: "SUV Compacto" },
      { CodigoGrupo: "7", Letra: "F", Descricao: "SUV Médio" },
      { CodigoGrupo: "8", Letra: "G", Descricao: "SUV Grande" },
      { CodigoGrupo: "9", Letra: "H", Descricao: "Luxo" },
      { CodigoGrupo: "10", Letra: "I", Descricao: "Pickup Compacta" },
      { CodigoGrupo: "11", Letra: "J", Descricao: "Pickup Média" },
      { CodigoGrupo: "12", Letra: "K", Descricao: "Pickup Grande" }
    ];
    
    // Definir que uma tentativa de conexão foi feita
    res.locals.connectionAttempted = true;
    
    let pool;
    try {
      pool = await connectToDatabase();
    } catch (connError) {
      console.error('Erro ao conectar ao banco de dados para grupos:', connError);
      return res.status(200).json({
        message: 'Usando dados de fallback devido a problemas de conexão com o banco de dados',
        error: connError.message,
        data: fallbackData
      });
    }
    
    console.log('Executando consulta SQL para buscar grupos de veículos...');
    
    try {
      const result = await pool.request().query(`
        SELECT 
          CodigoGrupo,
          Letra,
          Descricao
        FROM 
          VeiculosGrupos
        ORDER BY 
          Letra
      `);
      
      console.log(`Consulta SQL executada com sucesso. Grupos encontrados: ${result.recordset.length}`);
      
      if (result.recordset.length > 0) {
        console.log('Primeiros registros:', result.recordset.slice(0, 3));
      } else {
        console.log('Nenhum grupo de veículo encontrado');
      }
      
      res.json(result.recordset);
    } catch (queryError) {
      console.error('Erro na execução da consulta SQL de grupos:', queryError);
      // Fornecer dados padrão em caso de erro na consulta
      return res.status(200).json({
        message: 'Erro ao executar consulta SQL. Usando dados padrão.',
        error: queryError.message,
        data: fallbackData
      });
    }
  } catch (error) {
    console.error('Erro geral na busca de grupos de veículos:', error);
    res.status(200).json({
      message: 'Erro ao buscar grupos de veículos. Usando dados padrão.',
      error: error.message,
      data: [
        { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
        { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
        { CodigoGrupo: "3", Letra: "B+", Descricao: "Intermediário Plus" },
        { CodigoGrupo: "4", Letra: "C", Descricao: "Intermediário" },
        { CodigoGrupo: "5", Letra: "D", Descricao: "Executivo" },
        { CodigoGrupo: "6", Letra: "E", Descricao: "SUV Compacto" }
      ]
    });
  }
});

// Endpoint para buscar modelos de veículos por grupo
app.get('/api/vehicle-models/:groupCode', async (req, res) => {
  try {
    // Decodificar o parâmetro para lidar com caracteres especiais como '+'
    const groupCode = decodeURIComponent(req.params.groupCode);
    console.log(`Buscando modelos de veículos para o grupo: ${groupCode}`);
    
    // Definir dados de fallback personalizados para o grupo solicitado
    const fallbackData = [
      { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 75000 },
      { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 85000 },
      { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 95000 }
    ];
    
    // Definir que uma tentativa de conexão foi feita
    res.locals.connectionAttempted = true;
    
    let pool;
    try {
      pool = await connectToDatabase();
    } catch (connError) {
      console.error('Erro ao conectar ao banco de dados para modelos:', connError);
      return res.status(200).json({
        message: 'Usando dados de fallback devido a problemas de conexão',
        error: connError.message,
        data: fallbackData
      });
    }
    
    // Verificar se o groupCode é uma letra, uma letra seguida de + (como 'B+') ou dois caracteres (como 'BT')
    // Nota: precisamos considerar diferentes formatos de grupos
    const isLetterFormat = /^[A-Za-z](\+)?$/.test(groupCode);
    const isTwoCharFormat = /^[A-Za-z]{2}$/.test(groupCode);
    
    console.log(`Tipo de código de grupo: ${isLetterFormat ? 'Letra ou Letra+' : (isTwoCharFormat ? 'Dois caracteres' : 'Código')}`);
    
    let query;
    if (isLetterFormat || isTwoCharFormat) {
      // Se for letra, letra+ ou dois caracteres, usamos o mesmo tratamento
      query = `
        SELECT DISTINCT
          vm.CodigoModelo,
          vm.Descricao,
          vm.CodigoGrupoVeiculo,
          vg.Letra AS LetraGrupo,
          ISNULL((
            SELECT MAX(v.ValorCompra) 
            FROM Veiculos v 
            WHERE v.CodigoModelo = vm.CodigoModelo 
          ), 0) AS MaiorValorCompra
        FROM
          VeiculosModelos vm
        JOIN
          VeiculosGrupos vg ON vm.CodigoGrupoVeiculo = vg.CodigoGrupo
        WHERE
          vg.Letra = @groupCode
        GROUP BY
          vm.CodigoModelo, vm.Descricao, vm.CodigoGrupoVeiculo, vg.Letra
        ORDER BY
          vm.Descricao
      `;
    } else {
      query = `
        SELECT DISTINCT
          vm.CodigoModelo,
          vm.Descricao,
          vm.CodigoGrupoVeiculo,
          vg.Letra AS LetraGrupo,
          ISNULL((
            SELECT MAX(v.ValorCompra) 
            FROM Veiculos v 
            WHERE v.CodigoModelo = vm.CodigoModelo 
          ), 0) AS MaiorValorCompra
        FROM
          VeiculosModelos vm
        JOIN
          VeiculosGrupos vg ON vm.CodigoGrupoVeiculo = vg.CodigoGrupo
        WHERE
          vm.CodigoGrupoVeiculo = @groupCode
        GROUP BY
          vm.CodigoModelo, vm.Descricao, vm.CodigoGrupoVeiculo, vg.Letra
        ORDER BY
          vm.Descricao
      `;
    }
    
    console.log('Executando consulta SQL para buscar modelos...');
    
    try {
      const result = await pool.request()
        .input('groupCode', sql.VarChar, groupCode)
        .query(query);
      
      console.log(`Consulta SQL executada com sucesso. Modelos encontrados: ${result.recordset.length}`);
      if (result.recordset.length > 0) {
        console.log('Primeiro modelo encontrado:', result.recordset[0]);
      } else {
        console.log(`Nenhum modelo encontrado para o grupo ${groupCode}`);
      }
      
      res.json(result.recordset);
    } catch (queryError) {
      console.error('Erro na execução da consulta SQL de modelos:', queryError);
      // Fornecer dados padrão para o grupo específico
      return res.status(200).json({
        message: 'Erro ao executar consulta SQL para modelos. Usando dados padrão.',
        error: queryError.message,
        data: fallbackData
      });
    }
  } catch (error) {
    console.error('Erro geral na busca de modelos de veículos:', error);
    // Criar dados de fallback personalizados com o código do grupo
    const groupCode = req.params.groupCode || 'X';
    const fallbackData = [
      { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 75000 },
      { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 85000 },
      { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 95000 }
    ];
    
    res.status(200).json({
      message: 'Erro ao buscar modelos de veículos. Usando dados padrão.',
      error: error.message,
      data: fallbackData
    });
  }
});

// Endpoint para buscar todos os veículos (NOVO)
app.get('/api/vehicles/all', async (req, res) => {
  try {
    console.log('Buscando TODOS os veículos da base da Locavia...');
    
    // Definir dados de fallback para quando a conexão falhar
    const fallbackData = [];
    
    // Definir que uma tentativa de conexão foi feita
    res.locals.connectionAttempted = true;
    
    let pool;
    try {
      pool = await connectToDatabase();
    } catch (connError) {
      console.error('Erro ao conectar ao banco de dados para buscar todos os veículos:', connError);
      return res.status(500).json({
        message: 'Erro de conexão com o banco de dados',
        error: connError.message,
        data: fallbackData
      });
    }
    
    console.log('Executando consulta SQL para buscar TODOS os veículos...');
    
    try {
      const result = await pool.request().query(`
        SELECT 
          v.CodigoMVA,
          v.Placa,
          v.CodigoModelo,
          vm.Descricao AS DescricaoModelo,
          vm.CodigoGrupoVeiculo,
          vg.Letra AS LetraGrupo,
          vg.Descricao AS DescricaoGrupo,
          v.AnoFabricacaoModelo,
          v.Cor,
          v.TipoCombustivel,
          v.NumeroPassageiros,
          v.OdometroAtual,
          v.Status,
          vs.Descricao AS DescricaoStatus,
          v.ValorCompra,
          v.DataCompra
        FROM 
          Veiculos v
        LEFT JOIN 
          VeiculosModelos vm ON v.CodigoModelo = vm.CodigoModelo
        LEFT JOIN
          VeiculosGrupos vg ON vm.CodigoGrupoVeiculo = vg.CodigoGrupo
        LEFT JOIN
          VeiculosStatus vs ON v.Status = vs.Status
        ORDER BY 
          v.Placa
      `);
      
      console.log(`Consulta SQL executada com sucesso. Total de veículos encontrados: ${result.recordset.length}`);
      
      if (result.recordset.length > 0) {
        console.log('Primeiros 3 veículos:', result.recordset.slice(0, 3).map(v => ({
          placa: v.Placa,
          modelo: v.DescricaoModelo,
          grupo: v.LetraGrupo
        })));
      }
      
      res.json(result.recordset);
    } catch (queryError) {
      console.error('Erro na execução da consulta SQL de todos os veículos:', queryError);
      return res.status(500).json({
        message: 'Erro ao executar consulta SQL para buscar todos os veículos',
        error: queryError.message,
        data: fallbackData
      });
    }
  } catch (error) {
    console.error('Erro geral na busca de todos os veículos:', error);
    res.status(500).json({
      message: 'Erro ao buscar todos os veículos',
      error: error.message,
      data: []
    });
  }
});

// Rota de verificação de conexão
app.get('/api/status', (req, res) => {
  try {
    res.json({ 
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: {
        server: process.env.DB_SERVER ? 'configurado' : 'não configurado',
        user: process.env.DB_USER ? 'configurado' : 'não configurado',
        database: process.env.DB_DATABASE ? 'configurado' : 'não configurado',
        port: process.env.DB_PORT || '1433'
      }
    });
  } catch (error) {
    console.error('Erro ao retornar status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao retornar status', 
      error: error.message 
    });
  }
});

// Rota para testar conexão com o banco de dados
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('Testando conexão com o banco de dados...');
    console.log('Configuração utilizada:', {
      server: config.server,
      user: config.user,
      database: config.database,
      port: config.port,
      options: {
        connectTimeout: config.options.connectTimeout,
        requestTimeout: config.options.requestTimeout
      }
    });
    
    // Limpar qualquer conexão existente
    if (globalPool) {
      try {
        await globalPool.close();
        globalPool = null;
        console.log('Conexão anterior fechada para teste.');
      } catch (closeError) {
        console.error('Erro ao fechar conexão anterior:', closeError);
      }
    }
    
    // Estabelecer nova conexão
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Testar consulta simples
    const testResult = await pool.request().query`SELECT 1 as testValue, GETDATE() as serverTime`;
    console.log('Consulta de teste executada com sucesso:', testResult.recordset);
    
    res.json({ 
      status: 'success', 
      message: 'Conexão com o banco de dados estabelecida com sucesso!',
      testResult: testResult.recordset,
      serverTime: testResult.recordset[0].serverTime.toISOString(),
      config: {
        server: config.server,
        user: config.user,
        database: config.database,
        port: config.port,
        timeout: config.options.connectTimeout
      }
    });
    
    // Salvar conexão para reutilização
    globalPool = pool;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao conectar ao banco de dados', 
      error: error.message,
      stack: error.stack,
      config: {
        server: config.server,
        user: config.user,
        database: config.database,
        port: config.port,
        timeout: config.options.connectTimeout
      }
    });
  }
});

// Endpoint para verificar o tempo de resposta do banco
app.get('/api/ping', async (req, res) => {
  const startTime = Date.now();
  try {
    // Verificar se existe uma conexão global para reutilizar
    if (!globalPool) {
      await connectToDatabase();
    }
    
    // Realizar uma consulta simples
    const pingResult = await globalPool.request().query('SELECT GETDATE() AS serverTime');
    const endTime = Date.now();
    
    res.json({
      status: 'success',
      message: 'Ping realizado com sucesso',
      responseTimeMs: endTime - startTime,
      serverTime: pingResult.recordset[0].serverTime.toISOString(),
      clientTime: new Date().toISOString()
    });
  } catch (error) {
    const endTime = Date.now();
    console.error('Erro ao realizar ping do banco de dados:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao realizar ping do banco de dados',
      error: error.message,
      responseTimeMs: endTime - startTime
    });
  }
});

// Processar erros de encerramento da aplicação
process.on('exit', async () => {
  if (globalPool) {
    try {
      await globalPool.close();
      console.log('Conexão com o banco de dados fechada ao encerrar aplicação.');
    } catch (error) {
      console.error('Erro ao fechar conexão na saída:', error);
    }
  }
});

// Middleware para fechar conexões no final de cada requisição
app.use(async (req, res, next) => {
  // Já processou a request, mas não fechamos a conexão ainda
  if (res.locals.connectionAttempted && globalPool) {
    console.log('Mantendo conexão com o banco de dados ativa para reutilização.');
  }
  next();
});

// Iniciar o servidor com informações mais detalhadas
app.listen(PORT, () => {
  console.log(`API proxy rodando em http://localhost:${PORT}`);
  console.log(`Pronto para aceitar requisições dos clientes`);
  console.log(`Rotas disponíveis:`);
  console.log(`- GET /api/status`);
  console.log(`- GET /api/test-connection`);
  console.log(`- GET /api/ping`);
  console.log(`- GET /api/vehicles/:plate`);
  console.log(`- GET /api/vehicle-groups`);
  console.log(`- GET /api/vehicle-models/:groupCode`);
  console.log(`- GET /api/vehicles/all`);
  console.log(`Variáveis de ambiente carregadas do arquivo: ${envPath}`);
});
