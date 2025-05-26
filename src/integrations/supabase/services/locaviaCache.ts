import { supabase } from '../client';

// Interface para grupos de veículos do cache
export interface LocaviaVehicleGroupCache {
  id: string;
  codigo_grupo: string;
  letra: string;
  descricao: string;
  cached_at: string;
  updated_at: string;
}

// Interface para modelos de veículos do cache
export interface LocaviaVehicleModelCache {
  id: string;
  codigo_modelo: string;
  descricao: string;
  codigo_grupo_veiculo: string;
  letra_grupo: string;
  maior_valor_compra: number;
  cached_at: string;
  updated_at: string;
}

// Interface para veículos individuais do cache
export interface LocaviaVehicleCache {
  id: string;
  codigo_mva: number;
  placa: string;
  codigo_modelo: string;
  descricao_modelo: string;
  codigo_grupo_veiculo: string;
  letra_grupo: string;
  descricao_grupo: string;
  ano_fabricacao_modelo: string;
  cor: string;
  tipo_combustivel: string;
  numero_passageiros: number;
  odometro_atual: number;
  status: string;
  descricao_status: string;
  valor_compra: number;
  data_compra: string;
  cached_at: string;
  updated_at: string;
}

// Função para buscar grupos de veículos do cache
export async function getVehicleGroupsFromCache() {
  try {
    console.log('🔍 Buscando grupos de veículos do cache Supabase...');
    
    const { data, error } = await supabase
      .from('locavia_vehicle_groups_cache')
      .select('*')
      .order('letra', { ascending: true });
      
    if (error) {
      console.error('❌ Erro ao buscar grupos do cache:', error);
      return { success: false, error, groups: [], lastUpdate: null };
    }
    
    console.log(`✅ ${data?.length || 0} grupos encontrados no cache`);
    
    // Pegar o timestamp mais recente
    const lastUpdate = data && data.length > 0 
      ? new Date(Math.max(...data.map(item => new Date(item.cached_at).getTime())))
      : null;
    
    // Converter para o formato esperado
    const groups = data.map(group => ({
      CodigoGrupo: group.codigo_grupo,
      Letra: group.letra,
      Descricao: group.descricao
    }));
    
    return { success: true, groups, lastUpdate };
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar grupos do cache:', error);
    return { success: false, error, groups: [], lastUpdate: null };
  }
}

// Função para buscar modelos de veículos do cache por grupo
export async function getVehicleModelsFromCache(groupCode: string) {
  try {
    console.log(`🔍 Buscando modelos do grupo ${groupCode} no cache...`);
    
    const { data, error } = await supabase
      .from('locavia_vehicle_models_cache')
      .select('*')
      .eq('letra_grupo', groupCode)
      .order('descricao', { ascending: true });
      
    if (error) {
      console.error('❌ Erro ao buscar modelos do cache:', error);
      return { success: false, error, models: [], lastUpdate: null };
    }
    
    console.log(`✅ ${data?.length || 0} modelos encontrados no cache para o grupo ${groupCode}`);
    
    // Pegar o timestamp mais recente
    const lastUpdate = data && data.length > 0 
      ? new Date(Math.max(...data.map(item => new Date(item.cached_at).getTime())))
      : null;
    
    // Converter para o formato esperado
    const models = data.map(model => ({
      CodigoModelo: model.codigo_modelo,
      Descricao: model.descricao,
      CodigoGrupoVeiculo: model.codigo_grupo_veiculo,
      LetraGrupo: model.letra_grupo,
      MaiorValorCompra: model.maior_valor_compra
    }));
    
    return { success: true, models, lastUpdate };
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar modelos do cache:', error);
    return { success: false, error, models: [], lastUpdate: null };
  }
}

// Função para salvar grupos de veículos no cache
export async function saveVehicleGroupsToCache(groups: any[]) {
  try {
    console.log(`💾 Salvando ${groups.length} grupos no cache...`);
    
    // Preparar dados para inserção
    const cacheData = groups.map(group => ({
      codigo_grupo: group.CodigoGrupo,
      letra: group.Letra,
      descricao: group.Descricao
    }));
    
    // Usar upsert para inserir ou atualizar
    const { error } = await supabase
      .from('locavia_vehicle_groups_cache')
      .upsert(cacheData, { 
        onConflict: 'codigo_grupo,letra',
        ignoreDuplicates: false 
      });
      
    if (error) {
      console.error('❌ Erro ao salvar grupos no cache:', error);
      return { success: false, error };
    }
    
    console.log('✅ Grupos salvos no cache com sucesso');
    return { success: true };
  } catch (error) {
    console.error('💥 Erro inesperado ao salvar grupos no cache:', error);
    return { success: false, error };
  }
}

// Função para salvar modelos de veículos no cache
export async function saveVehicleModelsToCache(models: any[]) {
  try {
    console.log(`💾 Salvando ${models.length} modelos no cache...`);
    
    // Preparar dados para inserção
    const cacheData = models.map(model => ({
      codigo_modelo: model.CodigoModelo,
      descricao: model.Descricao,
      codigo_grupo_veiculo: model.CodigoGrupoVeiculo,
      letra_grupo: model.LetraGrupo,
      maior_valor_compra: model.MaiorValorCompra || 0
    }));
    
    // Usar upsert para inserir ou atualizar
    const { error } = await supabase
      .from('locavia_vehicle_models_cache')
      .upsert(cacheData, { 
        onConflict: 'codigo_modelo',
        ignoreDuplicates: false 
      });
      
    if (error) {
      console.error('❌ Erro ao salvar modelos no cache:', error);
      return { success: false, error };
    }
    
    console.log('✅ Modelos salvos no cache com sucesso');
    return { success: true };
  } catch (error) {
    console.error('💥 Erro inesperado ao salvar modelos no cache:', error);
    return { success: false, error };
  }
}

// Função para verificar se o cache está atualizado (dados mais recentes que X horas)
export async function isCacheRecent(tableName: 'locavia_vehicle_groups_cache' | 'locavia_vehicle_models_cache', hoursThreshold: number = 24) {
  try {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('cached_at')
      .gte('cached_at', thresholdTime.toISOString())
      .limit(1);
      
    if (error) {
      console.error(`Erro ao verificar atualização do cache ${tableName}:`, error);
      return { isRecent: false, lastUpdate: null };
    }
    
    const isRecent = data && data.length > 0;
    
    // Buscar a data mais recente no cache
    const { data: recentData } = await supabase
      .from(tableName)
      .select('cached_at')
      .order('cached_at', { ascending: false })
      .limit(1);
    
    const lastUpdate = recentData && recentData.length > 0 
      ? new Date(recentData[0].cached_at)
      : null;
    
    console.log(`Cache ${tableName} está ${isRecent ? 'atualizado' : 'desatualizado'}, última atualização: ${lastUpdate?.toLocaleString('pt-BR') || 'nunca'}`);
    return { isRecent, lastUpdate };
  } catch (error) {
    console.error(`Erro inesperado ao verificar cache ${tableName}:`, error);
    return { isRecent: false, lastUpdate: null };
  }
}

// Função para limpar cache antigo
export async function clearOldCache(tableName: 'locavia_vehicle_groups_cache' | 'locavia_vehicle_models_cache', hoursThreshold: number = 168) { // 7 dias
  try {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .lt('cached_at', thresholdTime.toISOString());
      
    if (error) {
      console.error(`Erro ao limpar cache antigo ${tableName}:`, error);
      return { success: false, error };
    }
    
    console.log(`Cache antigo do ${tableName} limpo com sucesso`);
    return { success: true };
  } catch (error) {
    console.error(`Erro inesperado ao limpar cache ${tableName}:`, error);
    return { success: false, error };
  }
}

// Função para buscar veículo por placa do cache
export async function getVehicleByPlateFromCache(plate: string) {
  try {
    console.log(`🔍 Buscando veículo com placa ${plate} no cache Supabase...`);
    
    const { data, error } = await supabase
      .from('locavia_vehicles_cache')
      .select('*')
      .eq('placa', plate)
      .maybeSingle();
      
    if (error) {
      console.error('❌ Erro ao buscar veículo do cache:', error);
      return { success: false, error, vehicle: null };
    }
    
    if (data) {
      console.log(`✅ Veículo com placa ${plate} encontrado no cache`);
      
      // Converter para o formato esperado com tipagem correta
      const vehicle = {
        CodigoMVA: data.codigo_mva,
        Placa: data.placa,
        CodigoModelo: data.codigo_modelo,
        DescricaoModelo: data.descricao_modelo,
        CodigoGrupoVeiculo: data.codigo_grupo_veiculo,
        LetraGrupo: data.letra_grupo,
        DescricaoGrupo: data.descricao_grupo,
        AnoFabricacaoModelo: data.ano_fabricacao_modelo,
        Cor: data.cor || '',
        TipoCombustivel: data.tipo_combustivel || '',
        NumeroPassageiros: data.numero_passageiros || 5,
        OdometroAtual: data.odometro_atual || 0,
        Status: data.status || '',
        DescricaoStatus: data.descricao_status || '',
        ValorCompra: data.valor_compra || 0,
        DataCompra: data.data_compra || ''
      };
      
      return { success: true, vehicle };
    } else {
      console.log(`ℹ️ Nenhum veículo com placa ${plate} encontrado no cache`);
      return { success: true, vehicle: null };
    }
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar veículo do cache:', error);
    return { success: false, error, vehicle: null };
  }
}

// Função para salvar veículo no cache
export async function saveVehicleToCache(vehicle: any) {
  try {
    console.log(`💾 Salvando veículo ${vehicle.Placa} no cache...`);
    
    const vehicleData = {
      codigo_mva: vehicle.CodigoMVA,
      placa: vehicle.Placa,
      codigo_modelo: vehicle.CodigoModelo,
      descricao_modelo: vehicle.DescricaoModelo,
      codigo_grupo_veiculo: vehicle.CodigoGrupoVeiculo,
      letra_grupo: vehicle.LetraGrupo,
      descricao_grupo: vehicle.DescricaoGrupo,
      ano_fabricacao_modelo: vehicle.AnoFabricacaoModelo,
      cor: vehicle.Cor || '',
      tipo_combustivel: vehicle.TipoCombustivel || '',
      numero_passageiros: vehicle.NumeroPassageiros || 5,
      odometro_atual: vehicle.OdometroAtual || 0,
      status: vehicle.Status || '',
      descricao_status: vehicle.DescricaoStatus || '',
      valor_compra: vehicle.ValorCompra || 0,
      data_compra: vehicle.DataCompra || ''
    };

    const { error } = await supabase
      .from('locavia_vehicles_cache')
      .upsert(vehicleData, { 
        onConflict: 'placa',
        ignoreDuplicates: false 
      });
      
    if (error) {
      console.error('❌ Erro ao salvar veículo no cache:', error);
      return { success: false, error };
    }
    
    console.log('✅ Veículo salvo no cache com sucesso');
    return { success: true };
  } catch (error) {
    console.error('💥 Erro inesperado ao salvar veículo no cache:', error);
    return { success: false, error };
  }
}

// Função para verificar se o cache de veículos está atualizado
export async function isVehicleCacheRecent(hoursThreshold: number = 24) {
  try {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT cached_at FROM public.locavia_vehicles_cache 
        WHERE cached_at >= $1 
        LIMIT 1
      `,
      params: [thresholdTime.toISOString()]
    });
      
    if (error) {
      console.error('Erro ao verificar atualização do cache de veículos:', error);
      return false;
    }
    
    const isRecent = data && Array.isArray(data) && data.length > 0;
    console.log(`Cache de veículos está ${isRecent ? 'atualizado' : 'desatualizado'}`);
    return isRecent;
  } catch (error) {
    console.error('Erro inesperado ao verificar cache de veículos:', error);
    return false;
  }
}

// Função para limpar cache antigo de veículos
export async function clearOldVehicleCache(hoursThreshold: number = 168) { // 7 dias
  try {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        DELETE FROM public.locavia_vehicles_cache 
        WHERE cached_at < $1
      `,
      params: [thresholdTime.toISOString()]
    });
      
    if (error) {
      console.error('Erro ao limpar cache antigo de veículos:', error);
      return { success: false, error };
    }
    
    console.log('Cache antigo de veículos limpo com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro inesperado ao limpar cache de veículos:', error);
    return { success: false, error };
  }
}
