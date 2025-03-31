
import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';

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

// Função para converter para UUID válido
export const convertToValidUuid = (id: string) => {
  try {
    // Verifica se já é um UUID válido
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
    // Gera um novo UUID para IDs simples
    return uuidv4();
  } catch (error) {
    console.error('Erro ao processar UUID:', error);
    return uuidv4();
  }
};

// Função para obter veículos do Supabase - agora com parâmetro "includeUsed" explícito
export const getVehiclesFromSupabase = async (includeUsed: boolean = true) => {
  try {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!includeUsed) {
      query = query.eq('is_used', false);
    }

    const { data, error } = await query;

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

// Função para criar ou atualizar um veículo
export const createOrUpdateVehicle = async (vehicle: Partial<VehicleData>) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .upsert({
        id: vehicle.id || undefined,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        value: vehicle.value,
        is_used: vehicle.is_used,
        plate_number: vehicle.plate_number,
        group_id: vehicle.group_id,
        color: vehicle.color,
        odometer: vehicle.odometer,
        fuel_type: vehicle.fuel_type,
        maintenance_cost: vehicle.maintenance_cost,
        depreciation_cost: vehicle.depreciation_cost,
        monthly_value: vehicle.monthly_value,
        extra_km_rate: vehicle.extra_km_rate,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Erro ao salvar veículo:', error);
      return { success: false, error: error.message };
    }

    return { success: true, vehicle: data[0] as VehicleData };
  } catch (error) {
    console.error('Erro inesperado ao salvar veículo:', error);
    return { success: false, error: 'Erro inesperado ao salvar veículo' };
  }
};

// Função para buscar um veículo pela placa
export const findVehicleByPlate = async (plateNumber: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .ilike('plate_number', plateNumber)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar veículo pela placa:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      vehicle: data as VehicleData | null
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículo pela placa:', error);
    return { success: false, error: 'Erro inesperado ao buscar veículo pela placa' };
  }
};

// Função para buscar veículos pela marca e modelo
export const findVehicleByBrandModel = async (brand: string, model: string) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .ilike('brand', `%${brand}%`)
      .ilike('model', `%${model}%`);

    if (error) {
      console.error('Erro ao buscar veículos por marca e modelo:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      vehicles: data as VehicleData[]
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículos por marca e modelo:', error);
    return { success: false, error: 'Erro inesperado ao buscar veículos por marca e modelo' };
  }
};
