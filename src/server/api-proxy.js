
// Este arquivo é usado para configurar um proxy de API local durante o desenvolvimento
// para contornar limitações de CORS e segurança em requisições diretas do navegador
// para o SQL Server

const express = require('express');
const cors = require('cors');
const sql = require('mssql');
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

// Endpoint para buscar veículo por placa
app.get('/api/vehicles/:plate', async (req, res) => {
  try {
    const { plate } = req.params;
    await sql.connect(config);
    
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
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: `Nenhum veículo encontrado com a placa ${plate}` });
    }
  } catch (error) {
    console.error('Erro na consulta SQL:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar veículo', 
      error: error.message 
    });
  } finally {
    await sql.close();
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`API proxy rodando em http://localhost:${PORT}`);
});
