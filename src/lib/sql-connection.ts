
import { supabase } from '@/integrations/supabase/client';

// Definição das interfaces
export interface SqlVehicle {
  CodigoMVA: number;
  Placa: string;
  CodigoModelo: string;
  DescricaoModelo: string;
  CodigoGrupoVeiculo: string;
  LetraGrupo: string;
  DescricaoGrupo: string;
  AnoFabricacaoModelo: string;
  Cor: string;
  TipoCombustivel: string;
  NumeroPassageiros: number;
  OdometroAtual: number;
  Status: string;
  DescricaoStatus: string;
  ValorCompra: number;
  DataCompra: string;
}

export interface SqlVehicleGroup {
  CodigoGrupo: string;
  Letra: string;
  Descricao: string;
}

export interface SqlVehicleModel {
  CodigoModelo: string;
  Descricao: string;
  CodigoGrupoVeiculo: string;
  LetraGrupo: string;
  MaiorValorCompra: number;
}

// Interface para o veículo do Supabase (para correção do erro de tipo)
export interface SupabaseVehicle {
  brand: string;
  color: string | null;
  created_at: string;
  created_by: string | null;
  group_id: string | null;
  id: string;
  is_used: boolean;
  model: string;
  odometer: number | null;
  plate_number: string | null;
  updated_at: string;
  value: number;
  year: number;
  fuel_type?: string | null; // Propriedade fuel_type como opcional
}

// Função para testar conexão com a API
export const testApiConnection = async () => {
  try {
    console.log('Testando conexão com a API...');
    const response = await fetch('http://localhost:3005/api/status');
    const data = await response.json();
    console.log('Resposta do teste de conexão:', data);
    return data;
  } catch (error) {
    console.error('Erro ao testar conexão com a API:', error);
    throw error;
  }
};

// Função para buscar veículo por placa
export const getVehicleByPlate = async (plate: string): Promise<SqlVehicle | null> => {
  try {
    console.log(`Buscando veículo com placa: ${plate}`);
    
    // Busca na API externa
    console.log('Buscando na API externa...');
    const response = await fetch(`http://localhost:3005/api/vehicles/${plate}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Nenhum veículo encontrado com a placa ${plate}`);
        return null;
      }
      
      const errorData = await response.json();
      console.error('Erro ao buscar veículo:', errorData);
      throw new Error(errorData.message || 'Erro ao buscar veículo');
    }
    
    const vehicle = await response.json();
    console.log('Veículo encontrado na API externa:', vehicle);
    
    // Após encontrar na API externa, armazenamos no Supabase para uso futuro
    if (vehicle) {
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          brand: vehicle.DescricaoModelo.split(' ')[0],
          model: vehicle.DescricaoModelo.split(' ').slice(1).join(' '),
          year: parseInt(vehicle.AnoFabricacaoModelo) || new Date().getFullYear(),
          value: vehicle.ValorCompra || 0,
          is_used: true,
          plate_number: vehicle.Placa,
          color: vehicle.Cor || '',
          odometer: vehicle.OdometroAtual || 0,
          fuel_type: vehicle.TipoCombustivel || '',
          group_id: vehicle.LetraGrupo || 'A'
        });
      
      if (insertError) {
        console.error('Erro ao salvar veículo no Supabase:', insertError);
      } else {
        console.log('Veículo salvo no Supabase com sucesso');
      }
    }
    
    return vehicle;
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    throw error;
  }
};

// Função para buscar grupos de veículos
export const getVehicleGroups = async (): Promise<SqlVehicleGroup[]> => {
  try {
    console.log('Buscando grupos de veículos...');
    
    // Primeiro, tentamos buscar do cache ou Supabase
    // Posteriormente, implementar cache
    
    const response = await fetch('http://localhost:3005/api/vehicle-groups');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao buscar grupos de veículos:', errorData);
      
      // Retornar dados padrão em caso de erro
      if (errorData.fallbackData) {
        console.log('Usando dados alternativos para grupos de veículos');
        return errorData.fallbackData;
      }
      
      throw new Error(errorData.message || 'Erro ao buscar grupos de veículos');
    }
    
    const groups = await response.json();
    console.log(`Grupos de veículos encontrados: ${groups.length}`);
    return groups;
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
    
    // Dados padrão em caso de erro
    console.log('Usando dados padrão para grupos de veículos devido a erro');
    return [
      { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
      { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
      { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
      { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
      { CodigoGrupo: "5", Letra: "E", Descricao: "SUV" },
      { CodigoGrupo: "6", Letra: "F", Descricao: "Luxo" }
    ];
  }
};

// Função para buscar modelos de veículos por grupo
export const getVehicleModelsByGroup = async (groupCode: string): Promise<SqlVehicleModel[]> => {
  try {
    console.log(`Buscando modelos de veículos para o grupo: ${groupCode}`);
    
    // Primeiro, tentamos buscar do cache ou Supabase
    // Posteriormente, implementar cache
    
    const response = await fetch(`http://localhost:3005/api/vehicle-models/${encodeURIComponent(groupCode)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erro ao buscar modelos de veículos para o grupo ${groupCode}:`, errorData);
      
      // Retornar dados padrão em caso de erro
      if (errorData.fallbackData) {
        console.log('Usando dados alternativos para modelos de veículos');
        return errorData.fallbackData;
      }
      
      throw new Error(errorData.message || 'Erro ao buscar modelos de veículos');
    }
    
    const models = await response.json();
    console.log(`Modelos de veículos encontrados para o grupo ${groupCode}: ${models.length}`);
    return models;
  } catch (error) {
    console.error(`Erro ao buscar modelos de veículos para o grupo ${groupCode}:`, error);
    
    // Dados padrão em caso de erro
    console.log('Usando dados padrão para modelos de veículos devido a erro');
    return [
      { CodigoModelo: `${groupCode}1`, Descricao: `Modelo 1 Grupo ${groupCode}`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 75000 },
      { CodigoModelo: `${groupCode}2`, Descricao: `Modelo 2 Grupo ${groupCode}`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 80000 },
      { CodigoModelo: `${groupCode}3`, Descricao: `Modelo 3 Grupo ${groupCode}`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 85000 }
    ];
  }
};
