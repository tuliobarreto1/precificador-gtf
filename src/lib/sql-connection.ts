
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
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
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
  if (!plate || plate.trim() === '') {
    throw new Error('Placa não informada ou vazia');
  }
  
  try {
    console.log(`Buscando veículo com placa: ${plate}`);
    
    // Verifica formato da placa (validação básica)
    if (plate.length < 6) {
      throw new Error('Formato de placa inválido');
    }
    
    // Busca na API externa
    console.log('Buscando na API externa...');
    const response = await fetch(`http://localhost:3005/api/vehicles/${encodeURIComponent(plate)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Nenhum veículo encontrado com a placa ${plate}`);
        return null;
      }
      
      // Tentar extrair mensagem do erro
      let errorMessage = `Erro ao buscar veículo: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Erro ao analisar resposta de erro:', e);
      }
      
      throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Resposta vazia do servidor');
    }
    
    let vehicle: SqlVehicle;
    try {
      vehicle = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao analisar JSON da resposta:', parseError, 'Texto recebido:', responseText);
      throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}`);
    }
    
    console.log('Veículo encontrado na API externa:', vehicle);
    
    // Após encontrar na API externa, armazenamos no Supabase para uso futuro
    if (vehicle) {
      try {
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
      } catch (dbError) {
        console.error('Erro ao inserir veículo no Supabase:', dbError);
        // Não interromper o fluxo por erro no cache
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

// Função para buscar os parâmetros de cálculo do servidor SQL
export const getCalculationParameters = async () => {
  try {
    console.log('Buscando parâmetros de cálculo do servidor SQL...');
    
    // Primeiro, tentamos buscar do cache ou Supabase
    const { data, error } = await supabase
      .from('calculation_params')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar parâmetros de cálculo:', error);
      throw error;
    }

    console.log('Parâmetros de cálculo recuperados:', data);
    
    // Verificar específicamente os valores de IPVA e licenciamento
    console.log('Valores de impostos recuperados do Supabase:', {
      ipva: data.ipva,
      licenciamento: data.licenciamento,
      ipva_tipo: typeof data.ipva,
      licenciamento_tipo: typeof data.licenciamento
    });
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar parâmetros de cálculo:', error);
    throw error;
  }
};
