
import { supabase } from '../client';

export const addVehicleToQuote = async (quoteId: string, vehicleData: any): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    // Verificar se o veículo já existe
    let vehicleId = vehicleData.vehicle_id;
    
    if (!vehicleId && vehicleData.vehicle) {
      // Se não tiver ID mas tiver objeto de veículo, verificar se já existe ou criar
      const vehicle = vehicleData.vehicle;
      
      if (vehicle.plateNumber) {
        const { data: existingVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('plate_number', vehicle.plateNumber)
          .limit(1);
          
        if (existingVehicles && Array.isArray(existingVehicles) && existingVehicles.length > 0) {
          vehicleId = existingVehicles[0].id;
        }
      }
      
      // Se ainda não tiver ID, criar veículo
      if (!vehicleId) {
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            brand: vehicle.brand || 'Não especificado',
            model: vehicle.model || 'Não especificado',
            year: vehicle.year || new Date().getFullYear(),
            value: vehicle.value || 0,
            plate_number: vehicle.plateNumber || null,
            is_used: vehicle.isUsed || false,
            group_id: vehicle.groupId || null
          })
          .select()
          .single();
          
        if (vehicleError) {
          console.error('Erro ao criar veículo:', vehicleError);
          return { success: false, error: vehicleError };
        }
        
        vehicleId = newVehicle.id;
      }
    }
    
    if (!vehicleId) {
      return { success: false, error: { message: 'ID do veículo não fornecido' } };
    }
    
    // Adicionar veículo ao orçamento
    const { data, error } = await supabase
      .from('quote_vehicles')
      .insert({
        quote_id: quoteId,
        vehicle_id: vehicleId,
        monthly_value: vehicleData.monthly_value || 0,
        monthly_km: vehicleData.monthly_km,
        contract_months: vehicleData.contract_months,
        operation_severity: vehicleData.operation_severity,
        has_tracking: vehicleData.has_tracking
      })
      .select();

    if (error) {
      console.error('Erro ao adicionar veículo ao orçamento:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado ao adicionar veículo ao orçamento:', error);
    return { success: false, error };
  }
};

export const getQuoteVehicles = async (quoteId: string): Promise<{ success: boolean; vehicles?: any[]; error?: any }> => {
  try {
    if (!quoteId) {
      console.error('ID do orçamento não fornecido');
      return { success: false, error: { message: 'ID do orçamento não fornecido' }, vehicles: [] };
    }
    
    console.log(`Buscando veículos para o orçamento ${quoteId}...`);
    
    const { data, error } = await supabase
      .from('quote_vehicles')
      .select(`
        id,
        quote_id,
        vehicle_id,
        monthly_value,
        monthly_km,
        contract_months,
        operation_severity,
        has_tracking,
        depreciation_cost,
        maintenance_cost,
        extra_km_rate,
        total_cost,
        protection_cost,
        protection_plan_id,
        vehicle:vehicle_id(*)
      `)
      .eq('quote_id', quoteId);

    if (error) {
      console.error('Erro ao buscar veículos do orçamento:', error);
      return { success: false, error, vehicles: [] };
    }
    
    const vehicles = data || [];
    console.log(`Encontrados ${vehicles.length} veículos para o orçamento ${quoteId}:`, vehicles);
    
    // Verificar se vehicles é um array
    if (!Array.isArray(vehicles)) {
      console.error('Resposta inesperada: vehicles não é um array', vehicles);
      return { success: true, vehicles: [] };
    }
    
    // Processar os veículos para garantir que todos os campos necessários estejam presentes
    const processedVehicles = vehicles.map(vehicle => {
      // Verificar se o veículo existe
      if (!vehicle || !vehicle.vehicle_id) {
        console.log(`Veículo inválido encontrado`, vehicle);
        // Criar um objeto de veículo vazio para evitar erros
        return {
          id: Math.random().toString(),
          monthly_value: 0,
          contract_months: 12,
          monthly_km: 2000,
          operation_severity: 3,
          has_tracking: false,
          depreciation_cost: 0,
          maintenance_cost: 0,
          extra_km_rate: 0,
          total_cost: 0,
          protection_cost: 0,
          protection_plan_id: null,
          vehicle: {
            id: Math.random().toString(),
            brand: 'Veículo desconhecido',
            model: '',
            year: new Date().getFullYear(),
            value: 0,
            is_used: false,
            group_id: 'A'
          }
        };
      }
      
      // Se o veículo não foi encontrado no banco de dados
      if (!vehicle.vehicle) {
        console.log(`Veículo com ID ${vehicle.vehicle_id} não encontrado na base de dados`);
        // Criar um objeto de veículo com base no ID
        return {
          id: vehicle.id || vehicle.vehicle_id,
          monthly_value: vehicle.monthly_value || vehicle.total_cost || 0,
          contract_months: vehicle.contract_months || 12,
          monthly_km: vehicle.monthly_km || 2000,
          operation_severity: vehicle.operation_severity || 3,
          has_tracking: vehicle.has_tracking || false,
          depreciation_cost: vehicle.depreciation_cost || 0,
          maintenance_cost: vehicle.maintenance_cost || 0,
          extra_km_rate: vehicle.extra_km_rate || 0,
          total_cost: vehicle.total_cost || vehicle.monthly_value || 0,
          protection_cost: vehicle.protection_cost || 0,
          protection_plan_id: vehicle.protection_plan_id || null,
          vehicle: {
            id: vehicle.vehicle_id,
            brand: 'Veículo não encontrado',
            model: '',
            year: new Date().getFullYear(),
            value: 0,
            is_used: false,
            group_id: 'A'
          }
        };
      }
      
      // Obter o objeto de veículo com segurança de tipo
      const vehicleObj = vehicle.vehicle as any;
      
      // Converter o formato do banco para o formato esperado pelo VehicleCard
      return {
        id: vehicle.id || vehicle.vehicle_id,
        monthly_value: vehicle.monthly_value || vehicle.total_cost || 0,
        contract_months: vehicle.contract_months || 12,
        monthly_km: vehicle.monthly_km || 2000,
        operation_severity: vehicle.operation_severity || 3,
        has_tracking: vehicle.has_tracking || false,
        depreciation_cost: vehicle.depreciation_cost || 0,
        maintenance_cost: vehicle.maintenance_cost || 0,
        extra_km_rate: vehicle.extra_km_rate || 0,
        total_cost: vehicle.total_cost || vehicle.monthly_value || 0,
        protection_cost: vehicle.protection_cost || 0,
        protection_plan_id: vehicle.protection_plan_id || null,
        vehicle: {
          id: vehicleObj?.id || vehicle.vehicle_id,
          brand: vehicleObj?.brand || 'Marca desconhecida',
          model: vehicleObj?.model || 'Modelo desconhecido',
          year: vehicleObj?.year || new Date().getFullYear(),
          value: vehicleObj?.value || 0,
          plateNumber: vehicleObj?.plate_number,
          plate_number: vehicleObj?.plate_number,
          color: vehicleObj?.color,
          isUsed: vehicleObj?.is_used || false,
          is_used: vehicleObj?.is_used || false,
          odometer: vehicleObj?.odometer || 0,
          groupId: vehicleObj?.group_id || 'A',
          group_id: vehicleObj?.group_id || 'A',
          fuelType: vehicleObj?.fuel_type,
          fuel_type: vehicleObj?.fuel_type
        }
      };
    });
    
    console.log('Veículos processados para exibição:', processedVehicles);
    
    return { success: true, vehicles: processedVehicles };
  } catch (error) {
    console.error('Erro inesperado ao buscar veículos do orçamento:', error);
    return { success: false, error, vehicles: [] };
  }
};
