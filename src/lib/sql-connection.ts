
import { toast } from '@/hooks/use-toast';

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

export const searchVehicleByPlate = async (plate: string): Promise<SqlVehicle | null> => {
  try {
    // In a real implementation, this would connect to SQL Server
    // For now, we'll mock the API call
    console.log(`Searching for vehicle with plate: ${plate}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if plate exists in our mock data
    if (plate.toUpperCase() === 'ABC1234') {
      // Return mock data
      return {
        Placa: 'ABC1234',
        DescricaoModelo: 'Toyota Corolla',
        AnoFabricacaoModelo: '2021',
        Cor: 'Prata',
        TipoCombustivel: 'Flex',
        OdometroAtual: 15000,
        ValorCompra: 120000,
        LetraGrupo: 'C'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching for vehicle:', error);
    toast({
      title: "Erro na busca",
      description: "Não foi possível conectar ao banco de dados.",
      variant: "destructive"
    });
    return null;
  }
};
