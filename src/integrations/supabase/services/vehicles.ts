
import { supabase } from '../core/client';
import { v4 as uuidv4 } from 'uuid';

// Função para buscar veículos do Supabase
export async function getVehiclesFromSupabase() {
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

// Função para converter IDs de timestamp para formato UUID
export const convertToValidUuid = (id: string | number): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof id === 'string' && uuidRegex.test(id)) {
    return id;
  }
  return uuidv4();
};

// Função para encontrar veículo pela placa
export async function findVehicleByPlate(plateNumber: string) {
  if (!plateNumber) return null;
  
  console.log(`Buscando veículo pela placa: ${plateNumber}`);
  
  const { data: existingVehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('plate_number', plateNumber)
    .limit(1);
    
  if (existingVehicles && Array.isArray(existingVehicles) && existingVehicles.length > 0) {
    return existingVehicles[0];
  }
  
  return null;
}

// Função para encontrar veículo pela marca/modelo
export async function findVehicleByBrandModel(brand: string, model: string) {
  if (!brand || !model) return null;
  
  console.log(`Buscando veículo pela marca/modelo: ${brand}/${model}`);
  
  const { data: existingVehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('brand', brand)
    .eq('model', model)
    .limit(1);
    
  if (existingVehicles && Array.isArray(existingVehicles) && existingVehicles.length > 0) {
    return existingVehicles[0];
  }
  
  return null;
}

// Função para criar ou atualizar veículo
export async function createOrUpdateVehicle(vehicleData: any) {
  try {
    console.log("Criando/atualizando veículo com dados:", vehicleData);
    
    const vehicleDataFormatted = {
      brand: vehicleData.brand || 'Não especificado',
      model: vehicleData.model || 'Não especificado',
      year: parseInt(vehicleData.year as any) || new Date().getFullYear(),
      value: parseFloat(vehicleData.value as any) || 0,
      plate_number: vehicleData.plateNumber || vehicleData.plate_number || null,
      // Determinamos is_used explicitamente - veículos com placa são sempre usados
      is_used: vehicleData.plateNumber || vehicleData.plate_number ? true : (vehicleData.isUsed === true || vehicleData.is_used === true), 
      group_id: vehicleData.groupId || vehicleData.group_id || 'A',
      color: vehicleData.color || null,
      odometer: parseInt(vehicleData.odometer as any) || 0,
      fuel_type: vehicleData.fuelType || vehicleData.fuel_type || 'Flex'
    };
    
    // Se tem ID, atualiza o veículo existente
    if (vehicleData.id && typeof vehicleData.id === 'string' && 
        vehicleData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleDataFormatted)
        .eq('id', vehicleData.id)
        .select();
        
      if (error) {
        console.error("Erro ao atualizar veículo:", error);
        return { success: false, error };
      }
      
      return { success: true, data, id: vehicleData.id };
    }
    
    // Caso contrário, cria um novo veículo
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleDataFormatted)
      .select();
      
    if (error) {
      console.error("Erro ao criar veículo:", error);
      
      // Tentativa alternativa de inserção sem usar single()
      const { data: fallbackInsert, error: fallbackError } = await supabase
        .from('vehicles')
        .insert(vehicleDataFormatted)
        .select();
        
      if (fallbackError) {
        console.error("Erro na tentativa alternativa de criar veículo:", fallbackError);
        return { success: false, error: fallbackError };
      } else if (fallbackInsert && Array.isArray(fallbackInsert) && fallbackInsert.length > 0) {
        return { success: true, data: fallbackInsert, id: fallbackInsert[0].id };
      } else {
        return { success: false, error: new Error("Nenhum veículo retornado após inserção alternativa") };
      }
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { success: false, error: new Error("Nenhum veículo retornado após inserção") };
    }
    
    return { success: true, data, id: data[0].id };
  } catch (error) {
    console.error("Erro inesperado ao criar/atualizar veículo:", error);
    return { success: false, error };
  }
}
