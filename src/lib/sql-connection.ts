
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
const CONNECTION_TIMEOUT = 15000; // 15 segundos
const MAX_RETRY_ATTEMPTS = 2; // Número máximo de tentativas
const RETRY_DELAY = 3000; // 3 segundos entre tentativas
let lastConnectionAttempt = 0;
let connectionFailCount = 0;
let cachedConnectionStatus: { status: 'online' | 'offline'; timestamp: number; error?: string } | null = null;

// Função auxiliar para aguardar um tempo específico
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    
    // Implementar lógica de retry com backoff
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Usar AbortController para limitar o tempo de espera
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
        
        const response = await fetch('http://localhost:3005/api/ping', { 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorMessage = `Erro na API: ${response.status} ${response.statusText}`;
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: ${errorMessage}`);
          
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await delay(RETRY_DELAY);
            continue;
          }
          
          cachedConnectionStatus = { 
            status: 'offline', 
            timestamp: now,
            error: errorMessage
          };
          
          connectionFailCount++;
          
          return { 
            status: 'offline', 
            error: errorMessage,
            failCount: connectionFailCount
          };
        }
        
        const data = await response.json();
        console.log('Resposta do teste de conexão:', data);
        
        // Resetar contador de falhas após sucesso
        connectionFailCount = 0;
        
        cachedConnectionStatus = { 
          status: 'online',
          timestamp: now
        };
        
        return {
          status: 'online',
          timestamp: new Date().toISOString(),
          responseTime: data.responseTimeMs,
          serverTime: data.serverTime
        };
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: Timeout ao conectar com a API`);
        } else {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou:`, fetchError);
        }
        
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await delay(RETRY_DELAY);
          continue;
        }
        
        const errorMessage = fetchError.name === 'AbortError' 
          ? 'Timeout ao conectar com a API' 
          : fetchError.message || 'Erro desconhecido';
        
        cachedConnectionStatus = { 
          status: 'offline', 
          timestamp: now,
          error: errorMessage
        };
        
        connectionFailCount++;
        
        return { 
          status: 'offline', 
          error: errorMessage,
          failCount: connectionFailCount
        };
      }
    }
    
    // Este código nunca deve ser alcançado, pois o loop de tentativas sempre retorna
    throw new Error('Erro inesperado no sistema de tentativas');
  } catch (error: any) {
    console.error('Erro ao testar conexão com a API:', error);
    connectionFailCount++;
    
    return { 
      status: 'offline', 
      error: error instanceof Error ? error.message : 'Erro ao conectar com a API',
      failCount: connectionFailCount
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
    
    // Este código nunca deve ser alcançado, pois o loop de tentativas sempre retorna ou lança erro
    throw new Error('Erro inesperado no sistema de tentativas');
  } catch (error: any) {
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
        { CodigoGrupo: "3", Letra: "B+", Descricao: "Intermediário Plus" },
        { CodigoGrupo: "4", Letra: "C", Descricao: "Intermediário" },
        { CodigoGrupo: "5", Letra: "D", Descricao: "Executivo" },
        { CodigoGrupo: "6", Letra: "E", Descricao: "SUV" },
        { CodigoGrupo: "7", Letra: "F", Descricao: "Luxo" }
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
        { CodigoGrupo: "3", Letra: "B+", Descricao: "Intermediário Plus" },
        { CodigoGrupo: "4", Letra: "C", Descricao: "Intermediário" },
        { CodigoGrupo: "5", Letra: "D", Descricao: "Executivo" },
        { CodigoGrupo: "6", Letra: "E", Descricao: "SUV" },
        { CodigoGrupo: "7", Letra: "F", Descricao: "Luxo" }
      ];
    }
    
    // Implementar lógica de retry
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
        
        const response = await fetch('http://localhost:3005/api/vehicle-groups', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: Erro ao buscar grupos de veículos:`, errorData);
          
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await delay(RETRY_DELAY);
            continue;
          }
          
          // Retornar dados do fallback se disponíveis
          if (errorData.data) {
            console.log('Usando dados alternativos para grupos de veículos');
            return errorData.data;
          }
          
          throw new Error(errorData.message || 'Erro ao buscar grupos de veículos');
        }
        
        const responseData = await response.json();
        
        // Verificar se a resposta tem o campo "data" (formato de fallback)
        const groups = responseData.data || responseData;
        
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
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: Timeout ao buscar grupos de veículos`);
        } else {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou:`, fetchError);
        }
        
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await delay(RETRY_DELAY);
          continue;
        }
        
        // Dados padrão em caso de erro
        console.log('Usando dados padrão para grupos de veículos devido a erro');
        return [
          { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
          { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
          { CodigoGrupo: "3", Letra: "B+", Descricao: "Intermediário Plus" },
          { CodigoGrupo: "4", Letra: "C", Descricao: "Intermediário" },
          { CodigoGrupo: "5", Letra: "D", Descricao: "Executivo" },
          { CodigoGrupo: "6", Letra: "E", Descricao: "SUV" },
          { CodigoGrupo: "7", Letra: "F", Descricao: "Luxo" }
        ];
      }
    }
    
    // Este código nunca deve ser alcançado
    throw new Error('Erro inesperado no sistema de tentativas');
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
    
    // Dados padrão em caso de erro
    console.log('Usando dados padrão para grupos de veículos devido a erro');
    return [
      { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
      { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
      { CodigoGrupo: "3", Letra: "B+", Descricao: "Intermediário Plus" },
      { CodigoGrupo: "4", Letra: "C", Descricao: "Intermediário" },
      { CodigoGrupo: "5", Letra: "D", Descricao: "Executivo" },
      { CodigoGrupo: "6", Letra: "E", Descricao: "SUV" },
      { CodigoGrupo: "7", Letra: "F", Descricao: "Luxo" }
    ];
  }
};

// Função para buscar modelos de veículos por grupo
export const getVehicleModelsByGroup = async (groupCode: string, useOfflineMode = false): Promise<SqlVehicleModel[]> => {
  try {
    console.log(`Buscando modelos de veículos para o grupo: ${groupCode}`);
    
    // Verificar no cache do Supabase primeiro
    try {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select('*')
        .eq('group_code', groupCode);
      
      if (data && !error && data.length > 0) {
        console.log(`Modelos encontrados no cache local para o grupo ${groupCode}:`, data.length);
        
        // Converter para o formato SqlVehicleModel
        return data.map(model => ({
          CodigoModelo: model.id.toString(),
          Descricao: model.description || model.name,
          CodigoGrupoVeiculo: model.group_id || "1",
          LetraGrupo: model.group_code,
          MaiorValorCompra: model.value || 75000
        }));
      }
    } catch (cacheError) {
      console.log('Erro ao buscar modelos no cache, continuando com API:', cacheError);
    }
    
    if (useOfflineMode) {
      console.log(`Modo offline ativado, retornando dados padrão para modelos do grupo ${groupCode}`);
      return [
        { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 75000 },
        { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 85000 },
        { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 95000 }
      ];
    }
    
    // Verificar status da conexão antes de tentar acessar a API
    const connectionStatus = await testApiConnection();
    if (connectionStatus.status !== 'online') {
      console.log(`Servidor offline, usando dados padrão para modelos do grupo ${groupCode}`);
      return [
        { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 75000 },
        { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 85000 },
        { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 95000 }
      ];
    }
    
    // Implementar lógica de retry
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
        
        const response = await fetch(`http://localhost:3005/api/vehicle-models/${encodeURIComponent(groupCode)}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: Erro ao buscar modelos para o grupo ${groupCode}:`, errorData);
          
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await delay(RETRY_DELAY);
            continue;
          }
          
          // Retornar dados do fallback se disponíveis
          if (errorData.data) {
            console.log(`Usando dados alternativos para modelos do grupo ${groupCode}`);
            return errorData.data;
          }
          
          throw new Error(errorData.message || `Erro ao buscar modelos para o grupo ${groupCode}`);
        }
        
        const responseData = await response.json();
        
        // Verificar se a resposta tem o campo "data" (formato de fallback)
        const models = responseData.data || responseData;
        
        console.log(`Modelos de veículos encontrados para o grupo ${groupCode}: ${models.length}`);
        
        // Salvar no cache do Supabase para uso futuro
        if (models && models.length > 0) {
          try {
            const modelsForCache = models.map((model: SqlVehicleModel) => ({
              group_code: model.LetraGrupo,
              group_id: model.CodigoGrupoVeiculo,
              description: model.Descricao,
              name: model.Descricao.split(' ').slice(-2).join(' '),
              value: model.MaiorValorCompra
            }));
            
            const { error } = await supabase
              .from('vehicle_models')
              .upsert(modelsForCache);
            
            if (error) {
              console.error('Erro ao salvar modelos no cache:', error);
            } else {
              console.log('Modelos salvos no cache com sucesso');
            }
          } catch (cacheError) {
            console.error('Erro ao inserir modelos no cache:', cacheError);
          }
        }
        
        return models;
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou: Timeout ao buscar modelos para o grupo ${groupCode}`);
        } else {
          console.error(`Tentativa ${attempt + 1}/${MAX_RETRY_ATTEMPTS} falhou:`, fetchError);
        }
        
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await delay(RETRY_DELAY);
          continue;
        }
        
        // Dados padrão em caso de erro
        console.log(`Usando dados padrão para modelos do grupo ${groupCode} devido a erro`);
        return [
          { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 75000 },
          { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 85000 },
          { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 95000 }
        ];
      }
    }
    
    // Este código nunca deve ser alcançado
    throw new Error('Erro inesperado no sistema de tentativas');
  } catch (error) {
    console.error(`Erro ao buscar modelos de veículos para o grupo ${groupCode}:`, error);
    
    // Dados padrão em caso de erro
    console.log(`Usando dados padrão para modelos do grupo ${groupCode} devido a erro`);
    return [
      { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 75000 },
      { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 85000 },
      { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: "1", LetraGrupo: groupCode, MaiorValorCompra: 95000 }
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
