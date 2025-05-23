import { supabase } from '@/integrations/supabase/client';

export interface SystemSetting {
  id: string;
  created_at: string;
  key: string;
  value: string;
}

export interface VehicleGroup {
  id?: string;
  created_at?: string;
  code: string;
  description: string;
  revision_km: number;
  revision_cost: number;
  tire_km: number;
  tire_cost: number;
  ipvaCost?: number;          // Percentual (ex: 0.024 = 2.4%)
  licensingCost?: number;     // Valor fixo anual
  name?: string;              // Nome do grupo
}

export interface CalculationParams {
  id?: string;
  created_at?: string;
  updated_at?: string;
  extra_km_percentage: number;
  depreciation_severity_multiplier: number;
  depreciation_mileage_multiplier: number;
  depreciation_base: number;
  tracking_cost: number;
  // Novos campos para depreciação personalizada
  depreciation_base_rate?: number;
  severity_multiplier_1?: number;
  severity_multiplier_2?: number;
  severity_multiplier_3?: number;
  severity_multiplier_4?: number;
  severity_multiplier_5?: number;
  severity_multiplier_6?: number;
  // Campos para taxas e índices
  ipca_rate?: number;
  igpm_rate?: number;
  tax_spread?: number;
  selic_month12?: number;
  selic_month18?: number;
  selic_month24?: number;
  last_tax_update?: string; // Modificado para ser somente string, não Date
}

export const fetchSystemSettings = async (): Promise<SystemSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar configurações do sistema:', error);
      return [];
    }
    
    console.log('Configurações do sistema carregadas:', data);
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar configurações do sistema:', error);
    return [];
  }
};

export const updateSystemSettings = async (settings: Record<string, string>): Promise<boolean> => {
  try {
    for (const key in settings) {
      const value = settings[key];
      
      const existingSetting = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();
      
      if (existingSetting.data) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('key', key);
        
        if (error) {
          console.error(`Erro ao atualizar configuração ${key}:`, error);
          return false;
        }
        
        console.log(`Configuração ${key} atualizada para ${value}`);
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([{ key, value }]);
        
        if (error) {
          console.error(`Erro ao inserir configuração ${key}:`, error);
          return false;
        }
        
        console.log(`Configuração ${key} inserida com valor ${value}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar configurações do sistema:', error);
    return false;
  }
};

export const fetchVehicleGroups = async (): Promise<VehicleGroup[]> => {
  try {
    console.log('🔍 Buscando grupos de veículos via settings.ts...');
    
    // Verificar se há uma sessão ativa do Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('📋 Sessão Supabase para grupos (settings):', sessionData.session ? 'Ativa' : 'Inativa');
    
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar grupos de veículos (settings):', error);
      return [];
    }
    
    console.log('📊 Dados de grupos retornados (settings):', data);

    const groups = data.map(group => ({
      id: group.id,
      created_at: group.created_at,
      code: group.code,
      description: group.description || '',
      revision_km: group.revision_km,
      revision_cost: group.revision_cost,
      tire_km: group.tire_km,
      tire_cost: group.tire_cost,
      ipvaCost: group.ipva_cost,
      licensingCost: group.licensing_cost,
      name: group.name || `Grupo ${group.code}`,
    }));
    
    console.log('✅ Grupos de veículos carregados (settings):', groups);
    return groups;
  } catch (error) {
    console.error('💥 Erro ao buscar grupos de veículos (settings):', error);
    return [];
  }
};

export const fetchCalculationParams = async (): Promise<CalculationParams | null> => {
  try {
    const { data, error } = await supabase
      .from('calculation_params')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Erro ao buscar parâmetros de cálculo:', error);
      return null;
    }
    
    console.log('Parâmetros de cálculo carregados:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar parâmetros de cálculo:', error);
    return null;
  }
};

export const updateCalculationParams = async (params: Partial<CalculationParams>): Promise<boolean> => {
  try {
    // Convertendo o Date para string se necessário
    if (params.last_tax_update && typeof params.last_tax_update !== 'string') {
      // Corrigindo o erro de tipagem garantindo que o valor é tratado como Date
      const dateValue = params.last_tax_update as unknown as Date;
      params.last_tax_update = dateValue.toISOString();
    }
    
    const { data, error } = await supabase
      .from('calculation_params')
      .update(params)
      .eq('id', (await fetchCalculationParams())?.id);
    
    if (error) {
      console.error('Erro ao atualizar parâmetros de cálculo:', error);
      return false;
    }
    
    console.log('Parâmetros de cálculo atualizados com sucesso:', data);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar parâmetros de cálculo:', error);
    return false;
  }
};

export const addVehicleGroup = async (group: Omit<VehicleGroup, 'id' | 'created_at'>): Promise<VehicleGroup | null> => {
  try {
    const dbGroup = {
      code: group.code,
      description: group.description,
      revision_km: group.revision_km,
      revision_cost: group.revision_cost,
      tire_km: group.tire_km,
      tire_cost: group.tire_cost,
      ipva_cost: group.ipvaCost,
      licensing_cost: group.licensingCost,
      name: group.name || `Grupo ${group.code}`,
    };
    
    const { data, error } = await supabase
      .from('vehicle_groups')
      .insert([dbGroup])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao adicionar grupo de veículo:', error);
      return null;
    }
    
    return {
      id: data.id,
      created_at: data.created_at,
      code: data.code,
      description: data.description || '',
      revision_km: data.revision_km,
      revision_cost: data.revision_cost,
      tire_km: data.tire_km,
      tire_cost: data.tire_cost,
      ipvaCost: data.ipva_cost,
      licensingCost: data.licensing_cost,
      name: data.name || `Grupo ${data.code}`,
    };
  } catch (error) {
    console.error('Erro ao adicionar grupo de veículo:', error);
    return null;
  }
};

export const updateVehicleGroup = async (id: string, group: Partial<VehicleGroup>): Promise<boolean> => {
  try {
    const dbGroup: Record<string, any> = {};
    
    if (group.description !== undefined) dbGroup.description = group.description;
    if (group.revision_km !== undefined) dbGroup.revision_km = group.revision_km;
    if (group.revision_cost !== undefined) dbGroup.revision_cost = group.revision_cost;
    if (group.tire_km !== undefined) dbGroup.tire_km = group.tire_km;
    if (group.tire_cost !== undefined) dbGroup.tire_cost = group.tire_cost;
    if (group.ipvaCost !== undefined) dbGroup.ipva_cost = group.ipvaCost;
    if (group.licensingCost !== undefined) dbGroup.licensing_cost = group.licensingCost;
    if (group.name !== undefined) dbGroup.name = group.name;
    
    const { error } = await supabase
      .from('vehicle_groups')
      .update(dbGroup)
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao atualizar grupo de veículo:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar grupo de veículo:', error);
    return false;
  }
};

export const deleteVehicleGroup = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vehicle_groups')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir grupo de veículo:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir grupo de veículo:', error);
    return false;
  }
};
