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

// Interface para veículos do cache
export interface VehicleModelCache {
  group_code: string;
  group_id: string;
  model_description: string;
  model_code: string;
  value: number;
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

// Importar funções com cache
import { 
  getVehicleGroupsWithCache, 
  getVehicleModelsByGroupWithCache,
  getConnectionAndCacheStatus
} from './sql-connection-with-cache';

// Variáveis para configurar o comportamento offline
const CONNECTION_TIMEOUT = 15000; // 15 segundos
const MAX_RETRY_ATTEMPTS = 1; // Reduzido para 1 tentativa para evitar atrasos
const RETRY_DELAY = 1000; // 1 segundo entre tentativas
let lastConnectionAttempt = 0;
let connectionFailCount = 0;
let cachedConnectionStatus: { status: 'online' | 'offline'; timestamp: number; error?: string } | null = null;

// Função auxiliar para aguardar um tempo específico
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para testar conexão com a API
export const testApiConnection = async (): Promise<ConnectionStatus> => {
  console.log('🔄 Testando conexão com API e status do cache...');
  
  try {
    const status = await getConnectionAndCacheStatus();
    
    const connectionStatus: ConnectionStatus = {
      status: status.sqlServer === 'online' ? 'online' : 'offline',
      timestamp: new Date().toISOString(),
      cache: status.cache,
      recommendedMode: status.recommendedMode,
      message: status.sqlServer === 'online' 
        ? 'Conexão com SQL Server ativa' 
        : status.cache.available 
          ? 'SQL Server offline, cache disponível' 
          : 'SQL Server offline, cache indisponível'
    };
    
    console.log('✅ Status da conexão verificado:', connectionStatus);
    return connectionStatus;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return {
      status: 'offline',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      cache: {
        groupsRecent: false,
        modelsRecent: false,
        available: false
      },
      recommendedMode: 'cache',
      message: 'Erro ao verificar conexão'
    };
  }
};

// Função para buscar veículo por placa
export const getVehicleByPlate = async (plate: string, useOfflineMode = false): Promise<SqlVehicle | null> => {
  if (!plate || plate.trim() === '') {
    throw new Error('Placa não informada ou vazia');
  }
  
  try {
    console.log(`Buscando veículo com placa: ${plate}`);
    
    // Verifica formato da placa (validação básica)
    if (plate.length < 6) {
      throw new Error('Formato de placa inválido');
    }
    
    // Primeiro verifica no cache do Supabase
    console.log('Buscando veículo no cache local...');
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('plate_number', plate)
        .maybeSingle();
      
      if (data && !error) {
        console.log('Veículo encontrado no cache local:', data);
        
        // Converter para o formato SqlVehicle
        return {
          CodigoMVA: parseInt(data.id.toString().substring(0, 6)) || 0,
          Placa: data.plate_number || '',
          CodigoModelo: data.id.toString().substring(0, 4) || '',
          DescricaoModelo: `${data.brand} ${data.model}`,
          CodigoGrupoVeiculo: data.group_id || 'A',
          LetraGrupo: data.group_id || 'A',
          DescricaoGrupo: `Grupo ${data.group_id || 'A'}`,
          AnoFabricacaoModelo: data.year.toString() || new Date().getFullYear().toString(),
          Cor: data.color || '',
          TipoCombustivel: data.fuel_type || 'Flex',
          NumeroPassageiros: 5,
          OdometroAtual: data.odometer || 0,
          Status: 'D',
          DescricaoStatus: 'Disponível',
          ValorCompra: data.value || 0,
          DataCompra: data.created_at
        };
      }
    } catch (cacheError) {
      console.log('Erro ao buscar no cache, continuando com API:', cacheError);
    }
    
    if (useOfflineMode) {
      console.log('Modo offline ativado, retornando dados simulados');
      // Retornar dados simulados no modo offline
      return {
        CodigoMVA: parseInt(plate.replace(/\D/g, '')) || 1000,
        Placa: plate,
        CodigoModelo: '100',
        DescricaoModelo: 'Veículo Offline',
        CodigoGrupoVeiculo: 'A',
        LetraGrupo: 'A',
        DescricaoGrupo: 'Grupo A (Offline)',
        AnoFabricacaoModelo: new Date().getFullYear().toString(),
        Cor: 'Não informada',
        TipoCombustivel: 'Flex',
        NumeroPassageiros: 5,
        OdometroAtual: 0,
        Status: 'D',
        DescricaoStatus: 'Disponível (Offline)',
        ValorCompra: 60000,
        DataCompra: new Date().toISOString()
      };
    }
    
    // Verificar status da conexão antes de tentar acessar a API
    const connectionStatus = await testApiConnection();
    if (connectionStatus.status !== 'online') {
      throw new Error(`Servidor de banco de dados offline: ${connectionStatus.error || 'Não foi possível conectar'}`);
    }
    
    // Implementar lógica de retry para buscar na API externa
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Usar AbortController para limitar o tempo de espera
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
        
        const response = await fetch(`http://localhost:3005/api/vehicles/${encodeURIComponent(plate)}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
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
          
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: ${errorMessage}`);
          
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await delay(RETRY_DELAY);
            continue;
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
        } catch (parseError: any) {
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
                brand: vehicle.DescricaoModelo?.split(' ')[0] || '',
                model: vehicle.DescricaoModelo?.split(' ').slice(1).join(' ') || '',
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
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: Timeout ao buscar veículo`);
        } else {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou:`, fetchError);
        }
        
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await delay(RETRY_DELAY);
          continue;
        }
        
        if (fetchError.name === 'AbortError') {
          throw new Error(`Timeout ao buscar veículo: A requisição demorou mais de ${CONNECTION_TIMEOUT/1000} segundos`);
        }
        
        throw fetchError;
      }
    }
    
    // Este código nunca deve ser alcançado
    throw new Error('Erro inesperado no sistema de tentativas');
  } catch (error: any) {
    console.error('Erro ao buscar veículo:', error);
    throw error;
  }
};

// Função para buscar grupos de veículos
export async function getVehicleGroups(offlineMode: boolean = false): Promise<SqlVehicleGroup[]> {
  console.log(`🔍 Buscando grupos de veículos... Modo offline: ${offlineMode}`);
  
  try {
    const groups = await getVehicleGroupsWithCache(offlineMode);
    
    // Mapear para o formato SqlVehicleGroup
    const mappedGroups: SqlVehicleGroup[] = groups.map(group => ({
      CodigoGrupo: group.CodigoGrupo,
      Letra: group.Letra,
      Descricao: group.Descricao
    }));
    
    console.log(`✅ ${mappedGroups.length} grupos de veículos carregados`);
    return mappedGroups;
  } catch (error) {
    console.error('❌ Erro ao buscar grupos de veículos:', error);
    return [];
  }
}

// Função para buscar modelos de veículos por grupo
export async function getVehicleModelsByGroup(groupCode: string, offlineMode: boolean = false): Promise<SqlVehicleModel[]> {
  console.log(`🔍 Buscando modelos do grupo ${groupCode}... Modo offline: ${offlineMode}`);
  
  try {
    const models = await getVehicleModelsByGroupWithCache(groupCode, offlineMode);
    
    // Mapear para o formato SqlVehicleModel
    const mappedModels: SqlVehicleModel[] = models.map(model => ({
      CodigoModelo: model.CodigoModelo,
      Descricao: model.Descricao,
      CodigoGrupoVeiculo: model.CodigoGrupoVeiculo,
      LetraGrupo: model.LetraGrupo,
      MaiorValorCompra: model.MaiorValorCompra
    }));
    
    console.log(`✅ ${mappedModels.length} modelos do grupo ${groupCode} carregados`);
    return mappedModels;
  } catch (error) {
    console.error(`❌ Erro ao buscar modelos do grupo ${groupCode}:`, error);
    return [];
  }
}

// Função para buscar os parâmetros de cálculo do servidor SQL
export const getCalculationParameters = async () => {
  try {
    console.log('Buscando parâmetros de cálculo do servidor SQL...');
    
    // Primeiro, tentamos buscar do cache ou Supabase
    const { data, error } = await supabase
      .from('calculation_params')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar parâmetros de cálculo:', error);
      throw error;
    }

    // Se não encontrou no cache, usar valores padrão
    if (!data) {
      console.log('Parâmetros não encontrados, usando valores padrão');
      return {
        ipva: 4.00,
        licenciamento: 98.91,
        ipca_rate: 3.50,
        igpm_rate: 3.40,
        tax_spread: 5.30,
        tracking_cost: 50.00,
        depreciation_base: 20.00,
        depreciation_mileage_multiplier: 0.05,
        depreciation_severity_multiplier: 0.10,
        extra_km_percentage: 0.15
      };
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
    // Retornar valores padrão em caso de erro
    return {
      ipva: 4.00,
      licenciamento: 98.91,
      ipca_rate: 3.50,
      igpm_rate: 3.40,
      tax_spread: 5.30,
      tracking_cost: 50.00,
      depreciation_base: 20.00,
      depreciation_mileage_multiplier: 0.05,
      depreciation_severity_multiplier: 0.10,
      extra_km_percentage: 0.15
    };
  }
};

// Interface atualizada para incluir informações do cache
export interface ConnectionStatus {
  status: 'online' | 'offline';
  timestamp: string;
  error?: string;
  cache?: {
    groupsRecent: boolean;
    modelsRecent: boolean;
    available: boolean;
  };
  recommendedMode?: 'online' | 'cache';
  message?: string;
  failCount?: number;
}
