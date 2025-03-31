import { supabase } from '../client';

export interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  is_used: boolean;
  plate_number?: string;
  group_id?: string;
  color?: string;
  odometer?: number;
  fuel_type?: string;
  maintenance_cost?: number;
  depreciation_cost?: number;
  monthly_value?: number;
  extra_km_rate?: number;
  created_at: string;
  updated_at: string;
}

// Função para obter veículos do Supabase
// Parâmetro includeUsed é opcional e determina se veículos em uso também serão incluídos
export const getVehiclesFromSupabase = async (includeUsed: boolean = true) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      vehicles: data as VehicleData[] 
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículos:', error);
    return { success: false, error: 'Erro inesperado ao buscar veículos' };
  }
};

// Função para obter um veículo específico pelo ID
export const getVehicleById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar veículo:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      vehicle: data as VehicleData 
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículo:', error);
    return { success: false, error: 'Erro inesperado ao buscar veículo' };
  }
};

// Outras funções do serviço de veículos podem ser adicionadas aqui
