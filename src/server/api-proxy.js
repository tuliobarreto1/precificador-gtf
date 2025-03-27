
// Este arquivo é usado para configurar um proxy de API local durante o desenvolvimento
// para contornar limitações de CORS e segurança em requisições diretas do navegador
// para o SQL Server

const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar o content-type para todas as respostas da API
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Configurações do banco de dados padrão
const getDbConfig = (customConfig = null) => {
  // Se receber configurações personalizadas, use-as
  if (customConfig) {
    console.log('Usando configurações de conexão personalizadas');
    return {
      user: customConfig.user,
      password: customConfig.password,
      server: customConfig.server || process.env.DB_SERVER,
      database: customConfig.database || process.env.DB_DATABASE,
      port: parseInt(customConfig.port || process.env.DB_PORT || '1433', 10),
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
      }
    };
  }
  
  // Caso contrário, use as configurações do .env
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: true,
      trustServerCertificate: true,
      connectionTimeout: 30000,
      requestTimeout: 30000
    }
  };
};

// Logs detalhados para depuração
console.log('========= CONFIGURAÇÃO DO SERVIDOR =========');
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Configuração SQL padrão:');
console.log('- Servidor:', process.env.DB_SERVER);
console.log('- Porta:', process.env.DB_PORT);
console.log('- Usuário:', process.env.DB_USER);
console.log('- Banco de dados:', process.env.DB_DATABASE);
console.log('- Senha configurada:', process.env.DB_PASSWORD ? 'Sim' : 'Não');
console.log('- Comprimento da senha:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('=========================================');

// Endpoint para buscar veículo por placa
app.get('/api/vehicles/:plate', async (req, res) => {
  try {
    const { plate } = req.params;
    console.log(`Buscando veículo com placa: ${plate}`);
    
    console.log('Tentando conectar ao banco de dados...');
    let pool;
    try {
      pool = await sql.connect(getDbConfig());
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (connError) {
      console.error('Erro ao conectar ao banco de dados:', connError);
      return res.status(500).json({ 
        message: 'Erro ao conectar ao banco de dados', 
        error: connError.message,
        config: {
          server: process.env.DB_SERVER,
          user: process.env.DB_USER,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT
        }
      });
    }
    
    console.log('Executando consulta SQL...');
    const result = await pool.request()
      .input('plate', sql.VarChar, plate)
      .query(`
        SELECT 
          V.Placa, 
          M.Descricao AS DescricaoModelo, 
          V.AnoFabricacaoModelo, 
          V.Cor, 
          TC.Descricao AS TipoCombustivel, 
          V.OdometroAtual, 
          V.ValorCompra, 
          GVP.LetraGrupo
        FROM 
          TBVeiculos V
        INNER JOIN 
          TBModelos M ON V.CodModelo = M.Codigo
        INNER JOIN 
          TBTiposCombustivel TC ON V.CodTipoCombustivel = TC.Codigo
        LEFT JOIN 
          TBGruposVeiculosParametros GVP ON M.CodGrupoVeiculo = GVP.CodGrupoVeiculo
        WHERE 
          V.Placa = @plate
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
  } finally {
    try {
      await sql.close();
      console.log('Conexão com o banco de dados fechada.');
    } catch (err) {
      console.error('Erro ao fechar conexão:', err);
    }
  }
});

// Rota de verificação de conexão
app.get('/api/status', (req, res) => {
  try {
    const status = { 
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: {
        server: process.env.DB_SERVER ? 'configurado' : 'não configurado',
        user: process.env.DB_USER ? 'configurado' : 'não configurado',
        database: process.env.DB_DATABASE ? 'configurado' : 'não configurado',
        port: process.env.DB_PORT || '1433'
      }
    };
    console.log('Enviando status:', status);
    res.json(status);
  } catch (error) {
    console.error('Erro ao retornar status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao retornar status', 
      error: error.message 
    });
  }
});

// Rota para testar conexão com o banco de dados com credenciais personalizadas
app.post('/api/test-connection-custom', async (req, res) => {
  let pool = null;
  console.log('Recebida requisição para testar conexão personalizada');
  
  try {
    const { server, port, user, password, database } = req.body;
    
    console.log('Testando conexão com credenciais personalizadas...');
    console.log('Dados recebidos:');
    console.log('- Servidor:', server);
    console.log('- Porta:', port);
    console.log('- Usuário:', user);
    console.log('- Banco de dados:', database);
    console.log('- Senha fornecida:', password ? 'Sim' : 'Não');
    
    if (!server || !user || !password) {
      console.log('Erro: Campos obrigatórios faltando');
      return res.status(400).json({
        status: 'error',
        message: 'Servidor, usuário e senha são obrigatórios'
      });
    }
    
    const customConfig = {
      server,
      port: port || '1433',
      user,
      password,
      database: database || 'Locavia',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
      }
    };
    
    console.log('Tentando conectar com as credenciais fornecidas...');
    
    // Fechar conexões anteriores para evitar problemas
    try {
      await sql.close();
      console.log('Conexões anteriores fechadas com sucesso');
    } catch (e) {
      console.log('Nenhuma conexão anterior para fechar');
    }
    
    // Criar nova pool de conexão
    try {
      pool = await new sql.ConnectionPool(customConfig).connect();
      console.log('Conexão com o banco de dados estabelecida com sucesso!');
      
      // Testar consulta simples
      const testResult = await pool.request().query('SELECT 1 as testValue');
      console.log('Consulta de teste executada com sucesso:', testResult);
      
      const responseData = { 
        status: 'success', 
        message: 'Conexão com o banco de dados estabelecida com sucesso!',
        testResult: testResult.recordset,
        config: {
          server: customConfig.server,
          user: customConfig.user,
          database: customConfig.database,
          port: customConfig.port
        }
      };
      
      console.log('Enviando resposta de sucesso:', responseData);
      res.json(responseData);
    } catch (dbError) {
      console.error('Erro ao conectar ao banco de dados:', dbError);
      
      const errorData = { 
        status: 'error', 
        message: 'Erro ao conectar ao banco de dados', 
        error: dbError.message,
        stack: dbError.stack,
        config: req.body
      };
      
      console.log('Enviando resposta de erro:', errorData);
      res.status(500).json(errorData);
    } finally {
      // Fechar conexão
      if (pool) {
        try {
          await pool.close();
          console.log('Conexão com o banco de dados fechada.');
        } catch (err) {
          console.error('Erro ao fechar conexão:', err);
        }
      }
    }
  } catch (error) {
    console.error('Erro geral ao processar requisição:', error);
    
    const criticalError = { 
      status: 'error', 
      message: 'Erro ao processar requisição', 
      error: error.message,
      stack: error.stack,
      config: req.body
    };
    
    console.log('Enviando resposta de erro crítico:', criticalError);
    res.status(500).json(criticalError);
  }
});

// Rota para testar conexão com o banco de dados
app.get('/api/test-connection', async (req, res) => {
  let pool = null;
  
  try {
    console.log('Testando conexão com o banco de dados...');
    console.log('Configuração utilizada:', {
      server: process.env.DB_SERVER,
      user: process.env.DB_USER,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    });
    
    // Fechar conexões anteriores para evitar problemas
    try {
      await sql.close();
    } catch (e) {
      console.log('Nenhuma conexão anterior para fechar');
    }
    
    // Criar nova pool de conexão
    pool = await new sql.ConnectionPool(getDbConfig()).connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Testar consulta simples
    const testResult = await pool.request().query('SELECT 1 as testValue');
    console.log('Consulta de teste executada com sucesso:', testResult);
    
    res.json({ 
      status: 'success', 
      message: 'Conexão com o banco de dados estabelecida com sucesso!',
      testResult: testResult.recordset,
      config: {
        server: process.env.DB_SERVER,
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT
      }
    });
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao conectar ao banco de dados', 
      error: error.message,
      stack: error.stack,
      config: {
        server: process.env.DB_SERVER,
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT
      }
    });
  } finally {
    // Fechar conexão
    if (pool) {
      try {
        await pool.close();
        console.log('Conexão com o banco de dados fechada.');
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
});

// Rota de diagnóstico para testar conexão básica
app.get('/api/ping', (req, res) => {
  console.log('Requisição ping recebida');
  res.json({ status: 'ok', message: 'API funcionando', time: new Date().toISOString() });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`API proxy rodando em http://localhost:${PORT}`);
  console.log(`Variáveis de ambiente carregadas do arquivo: ${path.resolve(__dirname, '../../.env')}`);
});
