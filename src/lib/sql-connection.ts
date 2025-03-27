
import { toast } from '@/hooks/use-toast';
import sql from 'mssql';

// SQL Server connection configuration
const SQL_CONFIG = {
  server: import.meta.env.VITE_DB_SERVER,
  port: parseInt(import.meta.env.VITE_DB_PORT || '1433'),
  user: import.meta.env.VITE_DB_USER,
  password: import.meta.env.VITE_DB_PASSWORD,
  database: import.meta.env.VITE_DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export interface SqlVehicle {
  Placa: string;
  DescricaoModelo: string;
  AnoFabricacaoModelo: string;
  Cor: string;
  TipoCombustivel: string;
  OdometroAtual: number;
  ValorCompra: number;
  LetraGrupo: string;
}

// Function to execute SQL queries
const runSqlServerQuery = async (query: string, params: any[] = []): Promise<sql.IResult<any>> => {
  try {
    console.log('Connecting to SQL Server:', SQL_CONFIG.server);
    const pool = await sql.connect({
      server: SQL_CONFIG.server,
      port: SQL_CONFIG.port,
      user: SQL_CONFIG.user,
      password: SQL_CONFIG.password,
      database: SQL_CONFIG.database,
      options: SQL_CONFIG.options,
    });

    const request = pool.request();
    
    // Add parameters to the request
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    console.log('Executing query with params:', params);
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('SQL Server query error:', error);
    throw error;
  }
};

export const searchVehicleByPlate = async (plate: string): Promise<SqlVehicle | null> => {
  try {
    console.log(`Searching for vehicle with plate: ${plate}`);
    
    const query = `
      SELECT 
        v.CodigoMVA,
        v.Placa,
        v.CodigoModelo,
        vm.Descricao AS DescricaoModelo,
        vm.CodigoGrupoVeiculo,
        vg.Letra AS LetraGrupo,
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
    `;

    const result = await runSqlServerQuery(query, [plate]);
    
    if (result && result.recordset && result.recordset.length > 0) {
      const veiculo = result.recordset[0];
      console.log('Vehicle found:', veiculo);
      
      return {
        Placa: veiculo.Placa,
        DescricaoModelo: veiculo.DescricaoModelo,
        AnoFabricacaoModelo: veiculo.AnoFabricacaoModelo,
        Cor: veiculo.Cor,
        TipoCombustivel: veiculo.TipoCombustivel,
        OdometroAtual: veiculo.OdometroAtual,
        ValorCompra: veiculo.ValorCompra,
        LetraGrupo: veiculo.LetraGrupo
      };
    }
    
    console.log('No vehicle found with plate:', plate);
    return null;
  } catch (error) {
    console.error('Error searching for vehicle:', error);
    toast({
      title: "Erro na busca",
      description: "Não foi possível conectar ao banco de dados. " + (error instanceof Error ? error.message : ''),
      variant: "destructive"
    });
    return null;
  }
};
