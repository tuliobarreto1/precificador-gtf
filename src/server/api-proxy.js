
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
const PORT = 3001;

// Configurações do banco de dados
const config = {
  user: process.env.VITE_DB_USER,
  password: process.env.VITE_DB_PASSWORD,
  server: process.env.VITE_DB_SERVER,
  database: process.env.VITE_DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Adicionar logs para depuração
console.log('Configuração SQL:', {
  user: process.env.VITE_DB_USER,
  server: process.env.VITE_DB_SERVER,
  database: process.env.VITE_DB_DATABASE,
  // Não exibir a senha por motivos de segurança
});

// Endpoint para buscar veículo por placa
app.get('/api/vehicles/:plate', async (req, res) => {
  try {
    const { plate } = req.params;
    console.log(`Buscando veículo com placa: ${plate}`);
    
    await sql.connect(config);
    console.log('Conexão com o banco de dados estabelecida.');
    
    const result = await sql.query`
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
        V.Placa = ${plate}
    `;
    
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
      error: error.message 
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

// Adicionar uma rota de verificação de conexão
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    environment: {
      server: process.env.VITE_DB_SERVER ? 'configurado' : 'não configurado',
      user: process.env.VITE_DB_USER ? 'configurado' : 'não configurado',
      database: process.env.VITE_DB_DATABASE ? 'configurado' : 'não configurado'
    }
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`API proxy rodando em http://localhost:${PORT}`);
  console.log(`Variáveis de ambiente carregadas: ${Object.keys(process.env).filter(key => key.startsWith('VITE_')).join(', ')}`);
});

