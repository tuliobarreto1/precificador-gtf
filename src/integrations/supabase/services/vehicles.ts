
import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';

// Função para converter IDs de timestamp para formato UUID
export const convertToValidUuid = (id: string | number): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof id === 'string' && uuidRegex.test(id)) {
    return id;
  }
  return uuidv4();
};

// Função para buscar veículos do Supabase
export async function getVehiclesFromSupabase(filter?: string, filterValue?: string) {
  try {
    console.log("Buscando veículos do Supabase...", { filter, filterValue });
    
    let query = supabase.from('vehicles').select('*');
    
    if (filter && filterValue) {
      query = query.ilike(filter, `%${filterValue}%`);
    }
    
    const { data, error } = await query.order('brand', { ascending: true });
      
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

// Função para buscar veículos da Locavia
export async function getVehiclesFromLocavia(filter?: string, filterValue?: string) {
  try {
    console.log("Buscando veículos da Locavia...", { filter, filterValue });
    
    // Aqui você utilizaria a função real para buscar da API da Locavia
    // Por enquanto, estamos apenas simulando uma chamada à API externa
    const response = await fetch('http://localhost:3005/api/vehicles');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro ao buscar veículos da Locavia:", errorData);
      return { success: false, error: errorData, vehicles: [] };
    }
    
    const data = await response.json();
    
    // Transformar dados da Locavia para o formato usado no frontend
    const vehicles = data.map((item: any) => ({
      id: convertToValidUuid(item.CodigoMVA || item.id),
      brand: item.DescricaoModelo ? item.DescricaoModelo.split(' ')[0] : 'Não especificado',
      model: item.DescricaoModelo ? item.DescricaoModelo.split(' ').slice(1).join(' ') : 'Não especificado',
      year: parseInt(item.AnoFabricacaoModelo) || new Date().getFullYear(),
      value: item.ValorCompra || 0,
      plateNumber: item.Placa || null,
      plate_number: item.Placa || null,
      color: item.Cor || null,
      isUsed: true,  // Veículos da Locavia são sempre usados
      is_used: true,
      odometer: item.OdometroAtual || 0,
      fuelType: item.TipoCombustivel || null,
      fuel_type: item.TipoCombustivel || null,
      groupId: item.LetraGrupo || 'A',
      group_id: item.LetraGrupo || 'A'
    }));
    
    console.log(`Recuperados ${vehicles?.length || 0} veículos da Locavia com sucesso`);
    return { success: true, vehicles: vehicles || [] };
  } catch (error) {
    console.error("Erro inesperado ao buscar veículos da Locavia:", error);
    return { success: false, error, vehicles: [] };
  }
}

// Função para obter todos os veículos (combinando Supabase e Locavia se necessário)
export async function getAllVehicles(filter?: string, filterValue?: string) {
  try {
    const supabaseResult = await getVehiclesFromSupabase(filter, filterValue);
    // Descomentar a linha abaixo quando a integração com Locavia estiver pronta
    // const locaviaResult = await getVehiclesFromLocavia(filter, filterValue);
    
    const allVehicles = [
      ...(supabaseResult.vehicles || []),
      // ...(locaviaResult.vehicles || [])
    ];
    
    return {
      success: supabaseResult.success, // || locaviaResult.success,
      vehicles: allVehicles,
      error: supabaseResult.error // || locaviaResult.error
    };
  } catch (error) {
    console.error("Erro inesperado ao obter todos os veículos:", error);
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
      is_used: vehicle.isUsed === true || vehicle.is_used === true || !!vehicle.plateNumber || !!vehicle.plate_number,
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
    
    if (data) {
      return data;
    }
    
    // Se não encontrar no Supabase, buscar na API da Locavia
    try {
      const response = await fetch(`http://localhost:3005/api/vehicles/${plateNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Erro ao buscar veículo da Locavia');
      }
      
      const locaviaVehicle = await response.json();
      
      if (!locaviaVehicle) {
        return null;
      }
      
      // Transformar para o formato do frontend
      return {
        id: convertToValidUuid(locaviaVehicle.CodigoMVA || ''),
        brand: locaviaVehicle.DescricaoModelo ? locaviaVehicle.DescricaoModelo.split(' ')[0] : 'Não especificado',
        model: locaviaVehicle.DescricaoModelo ? locaviaVehicle.DescricaoModelo.split(' ').slice(1).join(' ') : 'Não especificado',
        year: parseInt(locaviaVehicle.AnoFabricacaoModelo) || new Date().getFullYear(),
        value: locaviaVehicle.ValorCompra || 0,
        plateNumber: locaviaVehicle.Placa,
        plate_number: locaviaVehicle.Placa,
        color: locaviaVehicle.Cor || null,
        isUsed: true,
        is_used: true,
        odometer: locaviaVehicle.OdometroAtual || 0,
        fuelType: locaviaVehicle.TipoCombustivel || null,
        fuel_type: locaviaVehicle.TipoCombustivel || null,
        groupId: locaviaVehicle.LetraGrupo || 'A',
        group_id: locaviaVehicle.LetraGrupo || 'A'
      };
    } catch (error) {
      console.error("Erro ao buscar veículo da Locavia:", error);
      return null;
    }
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
