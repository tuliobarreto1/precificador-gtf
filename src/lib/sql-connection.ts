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

// Variáveis para configurar o comportamento offline
const CONNECTION_TIMEOUT = 10000; // 10 segundos
let lastConnectionAttempt = 0;
let cachedConnectionStatus: { status: 'online' | 'offline'; timestamp: number; error?: string } | null = null;

// Função para testar conexão com a API
export const testApiConnection = async () => {
  try {
    // Verificar se já temos um status de conexão recente (menos de 30 segundos)
    const now = Date.now();
    if (cachedConnectionStatus && (now - cachedConnectionStatus.timestamp < 30000)) {
      console.log('Usando status de conexão em cache:', cachedConnectionStatus);
      return { 
        status: cachedConnectionStatus.status,
        timestamp: new Date().toISOString(),
        cached: true,
        lastChecked: new Date(cachedConnectionStatus.timestamp).toISOString(),
        error: cachedConnectionStatus.error
      };
    }

    // Limitar tentativas de conexão (não tentar mais que uma vez a cada 5 segundos)
    if (now - lastConnectionAttempt < 5000) {
      console.log('Muitas tentativas de conexão. Aguarde antes de tentar novamente.');
      return { 
        status: 'offline', 
        error: 'Muitas tentativas de conexão. Aguarde antes de tentar novamente.',
        throttled: true
      };
    }

    lastConnectionAttempt = now;
    console.log('Testando conexão com a API...');
    
    // Usar AbortController para limitar o tempo de espera
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    try {
      const response = await fetch('http://localhost:3005/api/status', { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorMessage = `Erro na API: ${response.status} ${response.statusText}`;
        console.error(errorMessage);
        
        cachedConnectionStatus = { 
          status: 'offline', 
          timestamp: now,
          error: errorMessage
        };
        
        return { 
          status: 'offline', 
          error: errorMessage 
        };
      }
      
      const data = await response.json();
      console.log('Resposta do teste de conexão:', data);
      
      cachedConnectionStatus = { 
        status: data.status === 'online' ? 'online' : 'offline',
        timestamp: now
      };
      
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Verificar se o erro foi por timeout
      if (fetchError.name === 'AbortError') {
        console.error('Timeout ao conectar com a API');
        
        cachedConnectionStatus = { 
          status: 'offline', 
          timestamp: now,
          error: 'Timeout ao conectar com a API'
        };
        
        return { 
          status: 'offline', 
          error: 'Timeout ao conectar com a API' 
        };
      }
      
      console.error('Erro ao testar conexão com a API:', fetchError);
      
      cachedConnectionStatus = { 
        status: 'offline', 
        timestamp: now,
        error: fetchError.message || 'Erro desconhecido'
      };
      
      return { 
        status: 'offline', 
        error: fetchError.message || 'Erro desconhecido' 
      };
    }
  } catch (error) {
    console.error('Erro ao testar conexão com a API:', error);
    return { 
      status: 'offline', 
      error: error instanceof Error ? error.message : 'Erro ao conectar com a API' 
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
    
    // Busca na API externa com timeout
    console.log('Buscando na API externa...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    try {
      const response = await fetch(`http://localhost:3005/api/vehicles/${encodeURIComponent(plate)}`, {
        signal: controller.signal
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error(`Timeout ao buscar veículo: A requisição demorou mais de ${CONNECTION_TIMEOUT/1000} segundos`);
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    throw error;
  }
};

// Função para buscar grupos de veículos
export const getVehicleGroups = async (useOfflineMode = false): Promise<SqlVehicleGroup[]> => {
  try {
    console.log('Buscando grupos de veículos...');
    
    // Verificar no cache do Supabase primeiro
    try {
      const { data, error } = await supabase
        .from('vehicle_groups')
        .select('*');
      
      if (data && !error && data.length > 0) {
        console.log('Grupos encontrados no cache local:', data.length);
        
        // Converter para o formato SqlVehicleGroup
        return data.map(group => ({
          CodigoGrupo: group.id.toString(),
          Letra: group.code || group.id.toString().charAt(0).toUpperCase(),
          Descricao: group.name || group.description || `Grupo ${group.code}`
        }));
      }
    } catch (cacheError) {
      console.log('Erro ao buscar grupos no cache, continuando com API:', cacheError);
    }
    
    if (useOfflineMode) {
      console.log('Modo offline ativado, retornando dados padrão para grupos');
      return [
        { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
        { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
        { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
        { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
        { CodigoGrupo: "5", Letra: "E", Descricao: "SUV" },
        { CodigoGrupo: "6", Letra: "F", Descricao: "Luxo" }
      ];
    }
    
    // Verificar status da conexão antes de tentar acessar a API
    const connectionStatus = await testApiConnection();
    if (connectionStatus.status !== 'online') {
      console.log('Servidor offline, usando dados padrão para grupos');
      // Dados padrão em caso de erro
      return [
        { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
        { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
        { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
        { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
        { CodigoGrupo: "5", Letra: "E", Descricao: "SUV" },
        { CodigoGrupo: "6", Letra: "F", Descricao: "Luxo" }
      ];
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
    
    try {
      const response = await fetch('http://localhost:3005/api/vehicle-groups', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
      
      // Salvar no cache do Supabase para uso futuro
      if (groups && groups.length > 0) {
        try {
          const groupsForCache = groups.map((group: SqlVehicleGroup) => ({
            code: group.Letra,
            name: `Grupo ${group.Letra}`,
            description: group.Descricao,
            revision_km: 10000,
            revision_cost: 500,
            tire_km: 40000,
            tire_cost: 2000
          }));
          
          const { error } = await supabase
            .from('vehicle_groups')
            .upsert(groupsForCache);
          
          if (error) {
            console.error('Erro ao salvar grupos no cache:', error);
          } else {
            console.log('Grupos salvos no cache com sucesso');
          }
        } catch (cacheError) {
          console.error('Erro ao inserir grupos no cache:', cacheError);
        }
      }
      
      return groups;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Timeout ao buscar grupos de veículos');
      } else {
        console.error('Erro ao buscar grupos de veículos:', fetchError);
      }
      
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
export const getVehicleModelsByGroup = async (groupCode: string, useOfflineMode = false): Promise<SqlVehicleModel[]> => {
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
