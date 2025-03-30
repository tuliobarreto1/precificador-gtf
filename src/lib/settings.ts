
// Serviço para gerenciar configurações do sistema
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  revision_km: number;
  revision_cost: number;
  tire_km: number;
  tire_cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface CalculationParams {
  id?: string;
  tracking_cost: number;
  depreciation_base: number;
  depreciation_mileage_multiplier: number;
  depreciation_severity_multiplier: number;
  extra_km_percentage: number;
  created_at?: string;
  updated_at?: string;
}

// Funções para configurações gerais do sistema
export const fetchSystemSettings = async (): Promise<SystemSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar configurações do sistema:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar configurações do sistema:', error);
    toast.error('Erro ao buscar configurações do sistema');
    return [];
  }
};

export const updateSystemSetting = async (id: string, value: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('id', id);
      
    if (error) {
      console.error('Erro ao atualizar configuração do sistema:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar configuração do sistema:', error);
    toast.error('Erro ao atualizar configuração do sistema');
    return false;
  }
};

export const updateSystemSettings = async (settings: Record<string, string>): Promise<boolean> => {
  try {
    // Vamos buscar todas as configurações primeiro
    const { data: existingSettings, error: fetchError } = await supabase
      .from('system_settings')
      .select('id, key');
      
    if (fetchError) {
      console.error('Erro ao buscar configurações existentes:', fetchError);
      throw fetchError;
    }
    
    // Cria um mapa de chave para ID
    const keyToIdMap = (existingSettings || []).reduce((map, setting) => {
      map[setting.key] = setting.id;
      return map;
    }, {} as Record<string, string>);
    
    // Para cada configuração no objeto de entrada, atualizamos o valor
    for (const [key, value] of Object.entries(settings)) {
      const id = keyToIdMap[key];
      
      if (id) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('id', id);
          
        if (error) {
          console.error(`Erro ao atualizar configuração ${key}:`, error);
          throw error;
        }
      } else {
        console.warn(`Chave de configuração não encontrada: ${key}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar configurações do sistema:', error);
    toast.error('Erro ao atualizar configurações do sistema');
    return false;
  }
};

// Funções para grupos de veículos
export const fetchVehicleGroups = async (): Promise<VehicleGroup[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .order('code', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar grupos de veículos:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
    toast.error('Erro ao buscar grupos de veículos');
    return [];
  }
};

export const addVehicleGroup = async (group: Omit<VehicleGroup, 'id' | 'created_at' | 'updated_at'>): Promise<VehicleGroup | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .insert(group)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao adicionar grupo de veículos:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao adicionar grupo de veículos:', error);
    toast.error('Erro ao adicionar grupo de veículos');
    return null;
  }
};

export const updateVehicleGroup = async (id: string, group: Partial<VehicleGroup>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vehicle_groups')
      .update(group)
      .eq('id', id);
      
    if (error) {
      console.error('Erro ao atualizar grupo de veículos:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar grupo de veículos:', error);
    toast.error('Erro ao atualizar grupo de veículos');
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
      console.error('Erro ao excluir grupo de veículos:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir grupo de veículos:', error);
    toast.error('Erro ao excluir grupo de veículos');
    return false;
  }
};

// Funções para parâmetros de cálculo
export const fetchCalculationParams = async (): Promise<CalculationParams | null> => {
  try {
    const { data, error } = await supabase
      .from('calculation_params')
      .select('*')
      .limit(1)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado, vamos criar um com valores padrão
        return null;
      }
      console.error('Erro ao buscar parâmetros de cálculo:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar parâmetros de cálculo:', error);
    toast.error('Erro ao buscar parâmetros de cálculo');
    return null;
  }
};

export const updateCalculationParams = async (params: CalculationParams): Promise<boolean> => {
  try {
    if (params.id) {
      // Se tiver ID, atualizamos o registro existente
      const { error } = await supabase
        .from('calculation_params')
        .update({
          tracking_cost: params.tracking_cost,
          depreciation_base: params.depreciation_base,
          depreciation_mileage_multiplier: params.depreciation_mileage_multiplier,
          depreciation_severity_multiplier: params.depreciation_severity_multiplier,
          extra_km_percentage: params.extra_km_percentage
        })
        .eq('id', params.id);
        
      if (error) {
        console.error('Erro ao atualizar parâmetros de cálculo:', error);
        throw error;
      }
    } else {
      // Se não tiver ID, inserimos um novo registro
      const { error } = await supabase
        .from('calculation_params')
        .insert({
          tracking_cost: params.tracking_cost,
          depreciation_base: params.depreciation_base,
          depreciation_mileage_multiplier: params.depreciation_mileage_multiplier,
          depreciation_severity_multiplier: params.depreciation_severity_multiplier,
          extra_km_percentage: params.extra_km_percentage
        });
        
      if (error) {
        console.error('Erro ao inserir parâmetros de cálculo:', error);
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar parâmetros de cálculo:', error);
    toast.error('Erro ao salvar parâmetros de cálculo');
    return false;
  }
};
