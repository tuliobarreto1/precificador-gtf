
import { toast } from '@/hooks/use-toast';

// SQL Vehicle interface
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

// Função para determinar qual API usar (proxy local em desenvolvimento, API real em produção)
const getApiUrl = () => {
  const isDev = import.meta.env.MODE === 'development';
  return isDev ? 'http://localhost:3001/api' : '/api';
};

// Função para buscar veículo por placa
export const searchVehicleByPlate = async (plate: string): Promise<SqlVehicle | null> => {
  try {
    console.log(`Buscando veículo com placa: ${plate}`);
    
    // Fazer requisição para a API
    const response = await fetch(`${getApiUrl()}/vehicles/${plate}`);
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      // Se o status for 404, o veículo não foi encontrado
      if (response.status === 404) {
        console.log('Nenhum veículo encontrado com placa:', plate);
        return null;
      }
      
      // Para outros erros, lançar exceção
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar veículo');
    }
    
    // Converter a resposta para JSON
    const vehicle = await response.json() as SqlVehicle;
    console.log('Veículo encontrado:', vehicle);
    return vehicle;
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    toast({
      title: "Erro na busca",
      description: "Não foi possível buscar o veículo. " + (error instanceof Error ? error.message : ''),
      variant: "destructive"
    });
    return null;
  }
};

// Mock database com alguns veículos de exemplo para desenvolvimento e testes
// Isso será usado apenas como fallback se a API estiver indisponível
export const mockVehicles: SqlVehicle[] = [
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

// Função de fallback para desenvolvimento e testes
export const searchVehicleByPlateMock = async (plate: string): Promise<SqlVehicle | null> => {
  try {
    console.log(`Buscando veículo mock com placa: ${plate}`);
    
    // Simular atraso de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Busca case insensitive
    const vehicle = mockVehicles.find(v => 
      v.Placa.toLowerCase() === plate.toLowerCase()
    );
    
    if (vehicle) {
      console.log('Veículo mock encontrado:', vehicle);
      return vehicle;
    }
    
    console.log('Nenhum veículo mock encontrado com placa:', plate);
    return null;
  } catch (error) {
    console.error('Erro na busca mock:', error);
    return null;
  }
};
