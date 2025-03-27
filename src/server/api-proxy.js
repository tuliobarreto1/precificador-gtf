
// Este arquivo é usado para configurar um proxy de API local durante o desenvolvimento
// para contornar limitações de CORS e segurança em requisições diretas do navegador
// para o SQL Server

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { Connection, Request, TYPES } = require('tedious');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Verificar se as configurações do banco de dados estão disponíveis
const checkDbConfig = () => {
  const requiredVars = ['DB_SERVER', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Configurações de banco de dados incompletas. Faltando: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
};

// Configurar o content-type para todas as respostas da API
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  // Desabilitar cache para evitar problemas de resposta
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Obter configurações de conexão com o banco de dados
const getConnectionConfig = (customConfig = null) => {
  // Se receber configurações personalizadas, use-as
  if (customConfig) {
    console.log('Usando configurações de conexão personalizadas');
    return {
      server: customConfig.server || process.env.DB_SERVER,
      authentication: {
        type: 'default',
        options: {
          userName: customConfig.user,
          password: customConfig.password
        }
      },
      options: {
        port: parseInt(customConfig.port || process.env.DB_PORT || '1433', 10),
        database: customConfig.database || process.env.DB_DATABASE,
        trustServerCertificate: true,
        encrypt: true,
        rowCollectionOnRequestCompletion: true,
        connectTimeout: 30000,
        requestTimeout: 30000
      }
    };
  }
  
  // Caso contrário, use as configurações do .env
  return {
    server: process.env.DB_SERVER,
    authentication: {
      type: 'default',
      options: {
        userName: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      }
    },
    options: {
      port: parseInt(process.env.DB_PORT || '1433', 10),
      database: process.env.DB_DATABASE,
      trustServerCertificate: true,
      encrypt: true,
      rowCollectionOnRequestCompletion: true,
      connectTimeout: 30000,
      requestTimeout: 30000
    }
  };
};

// Função para criar uma conexão com o banco de dados
const createConnection = (config) => {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);
    
    connection.on('connect', (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return reject(err);
      }
      console.log('Conexão estabelecida com sucesso!');
      resolve(connection);
    });
    
    connection.on('error', (err) => {
      console.error('Erro na conexão:', err);
      reject(err);
    });
    
    // Iniciar a conexão
    connection.connect();
  });
};

// Função para executar uma consulta e retornar os resultados
const executeQuery = (connection, query, params = []) => {
  return new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) {
        console.error('Erro ao executar consulta:', err);
        return reject(err);
      }
      
      // Transformar as linhas em objetos JSON
      const results = rows.map(row => {
        const item = {};
        row.forEach(column => {
          item[column.metadata.colName] = column.value;
        });
        return item;
      });
      
      resolve(results);
    });
    
    // Adicionar parâmetros à consulta
    params.forEach(param => {
      request.addParameter(param.name, param.type, param.value);
    });
    
    // Executar a consulta
    connection.execSql(request);
  });
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
    
    if (!checkDbConfig()) {
      return res.status(500).json({ 
        message: 'Configurações do banco de dados incompletas ou inválidas', 
        environment: {
          server: process.env.DB_SERVER,
          user: process.env.DB_USER,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT
        }
      });
    }
    
    console.log('Tentando conectar ao banco de dados...');
    let connection;
    
    try {
      connection = await createConnection(getConnectionConfig());
      
      const query = `
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
      `;
      
      const params = [
        { name: 'plate', type: TYPES.VarChar, value: plate }
      ];
      
      console.log('Executando consulta SQL...');
      const results = await executeQuery(connection, query, params);
      console.log('Consulta SQL executada com sucesso.');
      console.log(`Registros encontrados: ${results.length}`);
      
      if (results.length > 0) {
        console.log('Veículo encontrado:', results[0]);
        res.json(results[0]);
      } else {
        console.log(`Nenhum veículo encontrado com a placa ${plate}`);
        res.status(404).json({ message: `Nenhum veículo encontrado com a placa ${plate}` });
      }
    } catch (dbError) {
      console.error('Erro na operação do banco de dados:', dbError);
      res.status(500).json({ 
        message: 'Erro ao buscar veículo no banco de dados', 
        error: dbError.message,
        stack: dbError.stack
      });
    } finally {
      if (connection) {
        connection.close();
        console.log('Conexão com o banco de dados fechada.');
      }
    }
  } catch (error) {
    console.error('Erro geral na rota:', error);
    res.status(500).json({ 
      message: 'Erro ao processar requisição', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Rota de verificação de conexão
app.get('/api/status', (req, res) => {
  try {
    console.log('Recebida requisição de status da API');
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
  console.log('Recebida requisição para testar conexão personalizada');
  let connection = null;
  
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
      port,
      user,
      password,
      database: database || 'Locavia'
    };
    
    console.log('Criando conexão com as credenciais fornecidas...');
    
    try {
      connection = await createConnection(getConnectionConfig(customConfig));
      
      // Testar consulta simples
      const results = await executeQuery(connection, 'SELECT 1 as testValue');
      console.log('Consulta de teste executada com sucesso:', results);
      
      const responseData = { 
        status: 'success', 
        message: 'Conexão com o banco de dados estabelecida com sucesso!',
        testResult: results,
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
  } finally {
    // Fechar conexão
    if (connection) {
      connection.close();
      console.log('Conexão com o banco de dados fechada.');
    }
  }
});

// Rota para testar conexão com o banco de dados
app.get('/api/test-connection', async (req, res) => {
  let connection = null;
  
  try {
    console.log('Testando conexão com o banco de dados...');
    
    if (!checkDbConfig()) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Configurações do banco de dados incompletas ou inválidas', 
        environment: {
          server: process.env.DB_SERVER,
          user: process.env.DB_USER,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT
        }
      });
    }
    
    console.log('Criando conexão com as credenciais padrão...');
    
    try {
      connection = await createConnection(getConnectionConfig());
      
      // Testar consulta simples
      const results = await executeQuery(connection, 'SELECT 1 as testValue');
      console.log('Consulta de teste executada com sucesso:', results);
      
      res.json({ 
        status: 'success', 
        message: 'Conexão com o banco de dados estabelecida com sucesso!',
        testResult: results,
        config: {
          server: process.env.DB_SERVER,
          user: process.env.DB_USER,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT
        }
      });
    } catch (dbError) {
      console.error('Erro ao conectar ao banco de dados:', dbError);
      res.status(500).json({ 
        status: 'error', 
        message: 'Erro ao conectar ao banco de dados', 
        error: dbError.message,
        stack: dbError.stack,
        config: {
          server: process.env.DB_SERVER,
          user: process.env.DB_USER,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT
        }
      });
    }
  } catch (error) {
    console.error('Erro geral ao processar requisição:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao processar requisição', 
      error: error.message,
      stack: error.stack
    });
  } finally {
    // Fechar conexão
    if (connection) {
      connection.close();
      console.log('Conexão com o banco de dados fechada.');
    }
  }
});

// Rota de diagnóstico para testar conexão básica
app.get('/api/ping', (req, res) => {
  console.log('Requisição ping recebida');
  // Certifique-se de enviar apenas JSON
  res.json({ status: 'ok', message: 'API funcionando', time: new Date().toISOString() });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`API proxy rodando em http://localhost:${PORT}`);
  console.log(`Variáveis de ambiente carregadas do arquivo: ${path.resolve(__dirname, '../../.env')}`);
});
