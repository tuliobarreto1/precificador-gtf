
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

// Função para buscar veículo por placa do cache usando query SQL direta
export async function getVehicleByPlateFromCache(plate: string) {
  try {
    console.log(`🔍 Buscando veículo com placa ${plate} no cache Supabase...`);
    
    // Usando uma query SQL personalizada para acessar a tabela recém-criada
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT * FROM public.locavia_vehicles_cache 
        WHERE placa = $1 
        LIMIT 1
      `,
      params: [plate]
    });
      
    if (error) {
      console.error('❌ Erro ao buscar veículo do cache:', error);
      return { success: false, error, vehicle: null };
    }
    
    if (data && Array.isArray(data) && data.length > 0) {
      const vehicleData = data[0];
      console.log(`✅ Veículo com placa ${plate} encontrado no cache`);
      
      // Converter para o formato esperado
      const vehicle = {
        CodigoMVA: vehicleData.codigo_mva,
        Placa: vehicleData.placa,
        CodigoModelo: vehicleData.codigo_modelo,
        DescricaoModelo: vehicleData.descricao_modelo,
        CodigoGrupoVeiculo: vehicleData.codigo_grupo_veiculo,
        LetraGrupo: vehicleData.letra_grupo,
        DescricaoGrupo: vehicleData.descricao_grupo,
        AnoFabricacaoModelo: vehicleData.ano_fabricacao_modelo,
        Cor: vehicleData.cor,
        TipoCombustivel: vehicleData.tipo_combustivel,
        NumeroPassageiros: vehicleData.numero_passageiros,
        OdometroAtual: vehicleData.odometro_atual,
        Status: vehicleData.status,
        DescricaoStatus: vehicleData.descricao_status,
        ValorCompra: vehicleData.valor_compra,
        DataCompra: vehicleData.data_compra
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

// Função para salvar veículo no cache usando query SQL direta
export async function saveVehicleToCache(vehicle: any) {
  try {
    console.log(`💾 Salvando veículo ${vehicle.Placa} no cache...`);
    
    // Usando uma query SQL personalizada para inserir na tabela recém-criada
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        INSERT INTO public.locavia_vehicles_cache (
          codigo_mva, placa, codigo_modelo, descricao_modelo,
          codigo_grupo_veiculo, letra_grupo, descricao_grupo,
          ano_fabricacao_modelo, cor, tipo_combustivel,
          numero_passageiros, odometro_atual, status,
          descricao_status, valor_compra, data_compra
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (placa) 
        DO UPDATE SET
          codigo_mva = EXCLUDED.codigo_mva,
          codigo_modelo = EXCLUDED.codigo_modelo,
          descricao_modelo = EXCLUDED.descricao_modelo,
          codigo_grupo_veiculo = EXCLUDED.codigo_grupo_veiculo,
          letra_grupo = EXCLUDED.letra_grupo,
          descricao_grupo = EXCLUDED.descricao_grupo,
          ano_fabricacao_modelo = EXCLUDED.ano_fabricacao_modelo,
          cor = EXCLUDED.cor,
          tipo_combustivel = EXCLUDED.tipo_combustivel,
          numero_passageiros = EXCLUDED.numero_passageiros,
          odometro_atual = EXCLUDED.odometro_atual,
          status = EXCLUDED.status,
          descricao_status = EXCLUDED.descricao_status,
          valor_compra = EXCLUDED.valor_compra,
          data_compra = EXCLUDED.data_compra,
          updated_at = now()
      `,
      params: [
        vehicle.CodigoMVA,
        vehicle.Placa,
        vehicle.CodigoModelo,
        vehicle.DescricaoModelo,
        vehicle.CodigoGrupoVeiculo,
        vehicle.LetraGrupo,
        vehicle.DescricaoGrupo,
        vehicle.AnoFabricacaoModelo,
        vehicle.Cor,
        vehicle.TipoCombustivel,
        vehicle.NumeroPassageiros,
        vehicle.OdometroAtual,
        vehicle.Status,
        vehicle.DescricaoStatus,
        vehicle.ValorCompra,
        vehicle.DataCompra
      ]
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
