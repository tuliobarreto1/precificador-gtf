
import { supabase } from '../client';
import { Vehicle } from '@/lib/models';

// Função para buscar todos os veículos
export async function getAllVehicles() {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*');
      
    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return { success: false, error, vehicles: [] };
    }
    
    return { success: true, vehicles };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículos:', error);
    return { success: false, error, vehicles: [] };
  }
}

// Função para buscar todos os veículos com formatação
export async function getVehiclesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        group:group_id(*)
      `);
      
    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return { success: false, error, vehicles: [] };
    }
    
    const vehicles = data.map(vehicle => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      value: vehicle.value,
      isUsed: vehicle.is_used,
      plateNumber: vehicle.plate_number,
      color: vehicle.color,
      groupId: vehicle.group_id,
      fuelType: vehicle.fuel_type,
      odometer: vehicle.odometer
    }));
    
    return { success: true, vehicles };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículos:', error);
    return { success: false, error, vehicles: [] };
  }
}

// Função para criar ou atualizar um veículo
export async function createOrUpdateVehicle(vehicleData: any) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .upsert(vehicleData)
      .select();
      
    if (error) {
      console.error('Erro ao salvar veículo:', error);
      return { success: false, error };
    }
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro inesperado ao salvar veículo:', error);
    return { success: false, error };
  }
}
