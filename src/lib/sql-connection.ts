import { toast } from '@/hooks/use-toast';

// SQL Vehicle interface (keeping the same structure)
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

// Mock database with some example vehicles
const mockVehicles: SqlVehicle[] = [
  {
    Placa: 'ABC1234',
    DescricaoModelo: 'TOYOTA COROLLA',
    AnoFabricacaoModelo: '2022',
    Cor: 'BRANCO',
    TipoCombustivel: 'FLEX',
    OdometroAtual: 15000,
    ValorCompra: 120000,
    LetraGrupo: 'C'
  },
  {
    Placa: 'DEF5678',
    DescricaoModelo: 'HONDA CIVIC',
    AnoFabricacaoModelo: '2021',
    Cor: 'PRETO',
    TipoCombustivel: 'FLEX',
    OdometroAtual: 25000,
    ValorCompra: 110000,
    LetraGrupo: 'C'
  },
  {
    Placa: 'GHI9012',
    DescricaoModelo: 'VOLKSWAGEN GOL',
    AnoFabricacaoModelo: '2020',
    Cor: 'VERMELHO',
    TipoCombustivel: 'FLEX',
    OdometroAtual: 35000,
    ValorCompra: 60000,
    LetraGrupo: 'B'
  },
  {
    Placa: 'JKL3456',
    DescricaoModelo: 'FIAT UNO',
    AnoFabricacaoModelo: '2019',
    Cor: 'AZUL',
    TipoCombustivel: 'FLEX',
    OdometroAtual: 45000,
    ValorCompra: 45000,
    LetraGrupo: 'A'
  },
  {
    Placa: 'MNO7890',
    DescricaoModelo: 'CHEVROLET ONIX',
    AnoFabricacaoModelo: '2020',
    Cor: 'PRATA',
    TipoCombustivel: 'FLEX',
    OdometroAtual: 30000,
    ValorCompra: 70000,
    LetraGrupo: 'B'
  }
];

// Function to search a vehicle by plate
export const searchVehicleByPlate = async (plate: string): Promise<SqlVehicle | null> => {
  try {
    console.log(`Searching for vehicle with plate: ${plate}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Case insensitive search
    const vehicle = mockVehicles.find(v => 
      v.Placa.toLowerCase() === plate.toLowerCase()
    );
    
    if (vehicle) {
      console.log('Vehicle found:', vehicle);
      return vehicle;
    }
    
    console.log('No vehicle found with plate:', plate);
    return null;
  } catch (error) {
    console.error('Error searching for vehicle:', error);
    toast({
      title: "Erro na busca",
      description: "Não foi possível buscar o veículo. " + (error instanceof Error ? error.message : ''),
      variant: "destructive"
    });
    return null;
  }
};
