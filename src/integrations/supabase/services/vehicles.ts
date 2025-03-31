
import { supabase } from '../core/client';
import { v4 as uuidv4 } from 'uuid';

// Função para converter IDs de timestamp para formato UUID
export const convertToValidUuid = (id: string | number): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof id === 'string' && uuidRegex.test(id)) {
    return id;
  }
  return uuidv4();
};

export interface VehicleData {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  plate_number?: string;
  is_used: boolean;
  group_id?: string;
  color?: string;
  odometer?: number;
  fuel_type?: string;
  monthly_value?: number;
  depreciation_cost?: number;
  maintenance_cost?: number;
  extra_km_rate?: number;
}

// Função para buscar veículos do Supabase
export async function getVehiclesFromSupabase(options = {}) {
  try {
    console.log("Buscando veículos do Supabase...");
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('brand', { ascending: true });
      
    if (error) {
      console.error("Erro ao buscar veículos:", error);
      return { success: false, error, vehicles: [] };
    }
    
    console.log(`Recuperados ${data?.length || 0} veículos com sucesso`);
    return { success: true, vehicles: data || [] };
  } catch (error) {
    console.error("Erro inesperado ao buscar veículos:", error);
    return { success: false, error, vehicles: [] };
  }
}

// Função para criar ou atualizar um veículo
export async function createOrUpdateVehicle(vehicle: any) {
  try {
    const vehicleId = vehicle.id ? convertToValidUuid(vehicle.id) : uuidv4();
    
    const vehicleData = {
      id: vehicleId,
      brand: vehicle.brand || 'Não especificado',
      model: vehicle.model || 'Não especificado',
      year: parseInt(vehicle.year as any) || new Date().getFullYear(),
      value: parseFloat(vehicle.value as any) || 0,
      plate_number: vehicle.plateNumber || vehicle.plate_number || null,
      is_used: vehicle.isUsed === true || vehicle.is_used === true,
      group_id: vehicle.groupId || vehicle.group_id || 'A',
      color: vehicle.color || null,
      odometer: parseInt(vehicle.odometer as any) || 0,
      fuel_type: vehicle.fuelType || vehicle.fuel_type || 'Flex',
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('vehicles')
      .upsert(vehicleData)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao criar/atualizar veículo:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Erro inesperado ao criar/atualizar veículo:", error);
    return { success: false, error };
  }
}

// Função para buscar veículo pela placa
export async function findVehicleByPlate(plateNumber: string) {
  try {
    if (!plateNumber) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate_number', plateNumber)
      .maybeSingle();
      
    if (error) {
      console.error("Erro ao buscar veículo pela placa:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Erro inesperado ao buscar veículo pela placa:", error);
    return null;
  }
}

// Função para buscar veículo por marca e modelo
export async function findVehicleByBrandModel(brand: string, model: string) {
  try {
    if (!brand || !model) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('brand', brand)
      .eq('model', model)
      .maybeSingle();
      
    if (error) {
      console.error("Erro ao buscar veículo por marca/modelo:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Erro inesperado ao buscar veículo por marca/modelo:", error);
    return null;
  }
}
