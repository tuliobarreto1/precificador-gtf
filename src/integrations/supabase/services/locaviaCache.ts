
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
      return { success: false, error, groups: [] };
    }
    
    console.log(`✅ ${data?.length || 0} grupos encontrados no cache`);
    
    // Converter para o formato esperado
    const groups = data.map(group => ({
      CodigoGrupo: group.codigo_grupo,
      Letra: group.letra,
      Descricao: group.descricao
    }));
    
    return { success: true, groups };
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar grupos do cache:', error);
    return { success: false, error, groups: [] };
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
      return { success: false, error, models: [] };
    }
    
    console.log(`✅ ${data?.length || 0} modelos encontrados no cache para o grupo ${groupCode}`);
    
    // Converter para o formato esperado
    const models = data.map(model => ({
      CodigoModelo: model.codigo_modelo,
      Descricao: model.descricao,
      CodigoGrupoVeiculo: model.codigo_grupo_veiculo,
      LetraGrupo: model.letra_grupo,
      MaiorValorCompra: model.maior_valor_compra
    }));
    
    return { success: true, models };
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar modelos do cache:', error);
    return { success: false, error, models: [] };
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
      return false;
    }
    
    const isRecent = data && data.length > 0;
    console.log(`Cache ${tableName} está ${isRecent ? 'atualizado' : 'desatualizado'}`);
    return isRecent;
  } catch (error) {
    console.error(`Erro inesperado ao verificar cache ${tableName}:`, error);
    return false;
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
