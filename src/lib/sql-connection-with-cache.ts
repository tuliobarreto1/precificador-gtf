
import { 
  getVehicleGroupsFromCache, 
  getVehicleModelsFromCache,
  saveVehicleGroupsToCache,
  saveVehicleModelsToCache,
  isCacheRecent
} from '@/integrations/supabase/services/locaviaCache';

// Re-exportar tipos do arquivo original
export type { SqlVehicle, SqlVehicleGroup, SqlVehicleModel } from './sql-connection';

// Função para buscar grupos de veículos com fallback para cache
export async function getVehicleGroupsWithCache(forceOffline: boolean = false): Promise<any[]> {
  console.log('🔄 Iniciando busca de grupos de veículos com cache...');
  
  // Se forçar modo offline, usar apenas o cache
  if (forceOffline) {
    console.log('🔒 Modo offline forçado - usando apenas cache');
    const cacheResult = await getVehicleGroupsFromCache();
    return cacheResult.groups || [];
  }
  
  try {
    // Primeiro, tentar buscar do SQL Server (via API proxy)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout mais curto
    
    const response = await fetch('http://localhost:3005/api/vehicle-groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados obtidos do SQL Server via API proxy');
      
      // Se obteve dados do servidor, salvar no cache
      if (data && Array.isArray(data) && data.length > 0) {
        await saveVehicleGroupsToCache(data);
        console.log('💾 Dados salvos no cache para uso futuro');
        return data;
      }
    }
    
    console.log('⚠️ SQL Server indisponível - usando cache automaticamente');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏱️ Timeout na conexão - usando cache automaticamente');
    } else {
      console.log('🔄 Falha na conexão - usando cache automaticamente');
    }
  }
  
  // Se chegou aqui, houve problema com o SQL Server - usar cache sem mostrar erro
  console.log('🔄 Usando dados do cache...');
  const cacheResult = await getVehicleGroupsFromCache();
  
  if (cacheResult.success && cacheResult.groups.length > 0) {
    console.log(`✅ ${cacheResult.groups.length} grupos recuperados do cache`);
    return cacheResult.groups;
  }
  
  // Se o cache também falhou, retornar dados padrão
  console.log('⚠️ Cache vazio, usando dados padrão...');
  return [
    { CodigoGrupo: "1", Letra: "A", Descricao: "Compacto" },
    { CodigoGrupo: "2", Letra: "B", Descricao: "Econômico" },
    { CodigoGrupo: "3", Letra: "C", Descricao: "Intermediário" },
    { CodigoGrupo: "4", Letra: "D", Descricao: "Executivo" },
    { CodigoGrupo: "5", Letra: "E", Descricao: "SUV Compacto" },
    { CodigoGrupo: "6", Letra: "F", Descricao: "SUV Médio" }
  ];
}

// Função para buscar modelos de veículos com fallback para cache
export async function getVehicleModelsByGroupWithCache(groupCode: string, forceOffline: boolean = false): Promise<any[]> {
  console.log(`🔄 Iniciando busca de modelos para grupo ${groupCode} com cache...`);
  
  // Se forçar modo offline, usar apenas o cache
  if (forceOffline) {
    console.log('🔒 Modo offline forçado - usando apenas cache');
    const cacheResult = await getVehicleModelsFromCache(groupCode);
    return cacheResult.models || [];
  }
  
  try {
    // Primeiro, tentar buscar do SQL Server (via API proxy)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout mais curto
    
    const encodedGroupCode = encodeURIComponent(groupCode);
    const response = await fetch(`http://localhost:3005/api/vehicle-models/${encodedGroupCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Modelos do grupo ${groupCode} obtidos do SQL Server via API proxy`);
      
      // Se obteve dados do servidor, salvar no cache
      if (data && Array.isArray(data) && data.length > 0) {
        await saveVehicleModelsToCache(data);
        console.log('💾 Modelos salvos no cache para uso futuro');
        return data;
      }
    }
    
    console.log(`⚠️ SQL Server indisponível - usando cache automaticamente para grupo ${groupCode}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⏱️ Timeout na conexão - usando cache automaticamente para grupo ${groupCode}`);
    } else {
      console.log(`🔄 Falha na conexão - usando cache automaticamente para grupo ${groupCode}`);
    }
  }
  
  // Se chegou aqui, houve problema com o SQL Server - usar cache sem mostrar erro
  console.log('🔄 Usando dados do cache...');
  const cacheResult = await getVehicleModelsFromCache(groupCode);
  
  if (cacheResult.success && cacheResult.models.length > 0) {
    console.log(`✅ ${cacheResult.models.length} modelos do grupo ${groupCode} recuperados do cache`);
    return cacheResult.models;
  }
  
  // Se o cache também falhou, retornar dados padrão
  console.log('⚠️ Cache vazio, usando dados padrão...');
  return [
    { CodigoModelo: `${groupCode}1`, Descricao: `${groupCode} - Modelo Básico`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 75000 },
    { CodigoModelo: `${groupCode}2`, Descricao: `${groupCode} - Modelo Intermediário`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 85000 },
    { CodigoModelo: `${groupCode}3`, Descricao: `${groupCode} - Modelo Premium`, CodigoGrupoVeiculo: groupCode, LetraGrupo: groupCode, MaiorValorCompra: 95000 }
  ];
}

// Função para verificar status da conexão e do cache
export async function getConnectionAndCacheStatus(): Promise<{
  sqlServer: 'online' | 'offline';
  cache: {
    groupsRecent: boolean;
    modelsRecent: boolean;
    available: boolean;
    lastUpdate?: Date | null;
  };
  recommendedMode: 'online' | 'cache';
}> {
  try {
    // Testar conexão com SQL Server
    let sqlServerStatus: 'online' | 'offline' = 'offline';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:3005/api/status', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      sqlServerStatus = response.ok ? 'online' : 'offline';
    } catch (error) {
      sqlServerStatus = 'offline';
    }
    
    // Verificar status do cache
    const groupsCacheInfo = await isCacheRecent('locavia_vehicle_groups_cache', 24);
    const modelsCacheInfo = await isCacheRecent('locavia_vehicle_models_cache', 24);
    
    // Pegar o timestamp mais recente entre os dois caches
    const lastUpdate = [groupsCacheInfo.lastUpdate, modelsCacheInfo.lastUpdate]
      .filter(date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    
    return {
      sqlServer: sqlServerStatus,
      cache: {
        groupsRecent: groupsCacheInfo.isRecent,
        modelsRecent: modelsCacheInfo.isRecent,
        available: groupsCacheInfo.isRecent || modelsCacheInfo.isRecent,
        lastUpdate
      },
      recommendedMode: sqlServerStatus === 'online' ? 'online' : 'cache'
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return {
      sqlServer: 'offline',
      cache: {
        groupsRecent: false,
        modelsRecent: false,
        available: false,
        lastUpdate: null
      },
      recommendedMode: 'cache'
    };
  }
}
