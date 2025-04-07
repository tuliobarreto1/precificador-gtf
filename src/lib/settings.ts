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
  // Novos campos para impostos
  ipca_rate?: number;
  igpm_rate?: number;
  tax_spread?: number;
  selic_month12?: number;
  selic_month18?: number;
  selic_month24?: number;
}

// Função para buscar todas as configurações do sistema
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

// Função para atualizar as configurações do sistema
export const updateSystemSettings = async (settings: Record<string, string>): Promise<boolean> => {
  try {
    for (const key in settings) {
      const value = settings[key];
      
      // Verificar se a configuração já existe
      const existingSetting = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();
      
      if (existingSetting.data) {
        // Atualizar a configuração existente
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
        // Inserir uma nova configuração
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

// Função para buscar todos os grupos de veículos
export const fetchVehicleGroups = async (): Promise<VehicleGroup[]> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar grupos de veículos:', error);
      return [];
    }
    
    console.log('Grupos de veículos carregados:', data);
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos:', error);
    return [];
  }
};

// Função para buscar os parâmetros de cálculo
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

// Função para atualizar os parâmetros de cálculo
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
