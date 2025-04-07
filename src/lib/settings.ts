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
  ipvaCost?: number;
  licensingCost?: number;
  name?: string;
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
  depreciation_base_rate?: number;
  severity_multiplier_1?: number;
  severity_multiplier_2?: number;
  severity_multiplier_3?: number;
  severity_multiplier_4?: number;
  severity_multiplier_5?: number;
  severity_multiplier_6?: number;
  ipca_rate?: number;
  igpm_rate?: number;
  tax_spread?: number;
  selic_month12?: number;
  selic_month18?: number;
  selic_month24?: number;
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
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar grupos de veículos:', error);
      return [];
    }
    
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
    
    console.log('Grupos de veículos carregados:', groups);
    return groups;
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
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
