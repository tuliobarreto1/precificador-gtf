
import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateVehicle } from './vehicles';

export async function saveQuoteToSupabase(quoteData: any) {
  try {
    console.log("Iniciando salvamento de orçamento:", quoteData);
    
    // Garantir que o quoteId seja um UUID válido
    let quoteId = quoteData.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!quoteId || !uuidRegex.test(quoteId.toString())) {
      quoteId = uuidv4();
      console.log("ID não é um UUID válido, gerando novo ID:", quoteId);
    }
    
    let vehicleId = null;
    
    // Se houver um veículo vinculado diretamente ao orçamento, criar ou salvar primeiro
    if (quoteData.vehicleId) {
      const vehicleData = {
        id: quoteData.vehicleId,
        brand: quoteData.vehicleBrand || '',
        model: quoteData.vehicleModel || '',
        year: quoteData.vehicleYear || new Date().getFullYear(),
        value: quoteData.vehicleValue || 0,
        plate_number: quoteData.vehiclePlateNumber,
        is_used: quoteData.vehicleIsUsed || false,
        group_id: quoteData.vehicleGroupId
      };
      
      if (!uuidRegex.test(vehicleData.id.toString()) || vehicleData.id.toString().startsWith('new-')) {
        vehicleData.id = uuidv4();
        console.log("Vehicle ID não é um UUID válido, gerando novo ID:", vehicleData.id);
      }
      
      try {
        const { success, data: savedVehicle } = await createOrUpdateVehicle(vehicleData);
        if (success && savedVehicle) {
          vehicleId = savedVehicle.id;
          console.log("Veículo salvo com sucesso:", savedVehicle);
        } else {
          console.warn("Não foi possível salvar o veículo principal, continuando sem ele");
        }
      } catch (vehicleError) {
        console.error("Erro ao salvar veículo principal:", vehicleError);
      }
    }
    
    // Validar e certificar que campos críticos são do tipo correto
    const quoteToSave = {
      id: quoteId,
      title: quoteData.title || `Orçamento ${new Date().toLocaleDateString()}`,
      client_id: typeof quoteData.client_id === 'object' ? null : quoteData.client_id,
      vehicle_id: vehicleId,
      contract_months: quoteData.contract_months || 12,
      monthly_km: quoteData.monthly_km || 2000,
      operation_severity: quoteData.operation_severity || 3,
      has_tracking: quoteData.has_tracking || false,
      include_ipva: quoteData.include_ipva || false,
      include_licensing: quoteData.include_licensing || false,
      include_taxes: quoteData.include_taxes || false,
      total_value: quoteData.total_value || 0,
      monthly_values: quoteData.monthly_values || 0,
      status: quoteData.status || 'ORCAMENTO',
      status_flow: quoteData.status_flow || 'ORCAMENTO',
      global_protection_plan_id: quoteData.global_protection_plan_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Dados formatados para salvar:", quoteToSave);
    
    const { data, error } = await supabase
      .from('quotes')
      .upsert(quoteToSave)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao salvar orçamento:", error);
      return { success: false, error };
    }
    
    console.log("Orçamento salvo com sucesso:", data);
    return { success: true, quote: data };
  } catch (error) {
    console.error("Erro inesperado ao salvar orçamento:", error);
    return { success: false, error };
  }
}

export async function addVehicleToQuote(vehicleData: any) {
  try {
    console.log("Adicionando veículo ao orçamento:", vehicleData);
    
    if (!vehicleData.quoteId || !vehicleData.vehicle) {
      return { success: false, error: "Dados insuficientes para adicionar veículo" };
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Verificar se o veículo existe ou precisa ser criado
    let vehicleId = vehicleData.vehicle.id;
    
    if (!uuidRegex.test(vehicleId.toString()) || vehicleId.toString().startsWith('new-')) {
      // Criar um novo veículo
      const newVehicleData = {
        id: uuidv4(),
        brand: vehicleData.vehicle.brand || 'Não especificado',
        model: vehicleData.vehicle.model || 'Não especificado',
        year: vehicleData.vehicle.year || new Date().getFullYear(),
        value: vehicleData.vehicle.value || 0,
        plate_number: vehicleData.vehicle.plateNumber,
        is_used: vehicleData.vehicle.isUsed || false,
        group_id: vehicleData.vehicle.groupId
      };
      
      const { success, data: savedVehicle, error } = await createOrUpdateVehicle(newVehicleData);
      
      if (!success || error) {
        console.error("Erro ao criar veículo para o orçamento:", error);
        return { success: false, error };
      }
      
      vehicleId = savedVehicle.id;
      console.log("Novo veículo criado com sucesso:", savedVehicle);
    }
    
    // Preparar dados para o veículo no orçamento
    const quoteVehicleData = {
      quote_id: vehicleData.quoteId,
      vehicle_id: vehicleId,
      monthly_value: vehicleData.monthlyValue || 0,
      contract_months: vehicleData.params?.contractMonths || 24,
      monthly_km: vehicleData.params?.monthlyKm || 3000,
      operation_severity: vehicleData.params?.operationSeverity || 3,
      has_tracking: vehicleData.params?.hasTracking || false,
      include_ipva: vehicleData.params?.includeIpva || false,
      include_licensing: vehicleData.params?.includeLicensing || false,
      include_taxes: vehicleData.params?.includeTaxes || false,
      protection_plan_id: vehicleData.protectionPlanId || null,
      protection_cost: vehicleData.protectionCost || 0,
      depreciation_cost: vehicleData.depreciationCost || 0,
      maintenance_cost: vehicleData.maintenanceCost || 0,
      extra_km_rate: vehicleData.extraKmRate || 0,
      ipva_cost: vehicleData.ipvaCost || 0,
      licensing_cost: vehicleData.licensingCost || 0,
      tax_cost: vehicleData.taxCost || 0,
      total_cost: vehicleData.totalCost || 0
    };
    
    console.log("Dados do veículo para o orçamento:", quoteVehicleData);
    
    const { data, error } = await supabase
      .from('quote_vehicles')
      .upsert(quoteVehicleData)
      .select();
      
    if (error) {
      console.error("Erro ao adicionar veículo ao orçamento:", error);
      return { success: false, error };
    }
    
    console.log("Veículo adicionado ao orçamento com sucesso:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Erro inesperado ao adicionar veículo ao orçamento:", error);
    return { success: false, error };
  }
}

export async function getQuotesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id(*),
        vehicles:quote_vehicles(
          *,
          vehicle:vehicle_id(*)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar orçamentos:", error);
      return { success: false, error, quotes: [] };
    }
    
    console.log(`${data?.length || 0} orçamentos recuperados com sucesso`);
    return { success: true, quotes: data || [] };
  } catch (error) {
    console.error("Erro inesperado ao buscar orçamentos:", error);
    return { success: false, error, quotes: [] };
  }
}

export async function getQuoteByIdFromSupabase(id: string) {
  try {
    if (!id) {
      return { success: false, error: "ID não fornecido", quote: null };
    }
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id(*),
        vehicles:quote_vehicles(
          *,
          vehicle:vehicle_id(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.error(`Erro ao buscar orçamento ${id}:`, error);
      return { success: false, error, quote: null };
    }
    
    if (!data) {
      console.log(`Orçamento ${id} não encontrado`);
      return { success: true, quote: null };
    }
    
    console.log(`Orçamento ${id} recuperado com sucesso:`, data);
    
    // Transformar os dados para incluir informações de veículos de forma mais acessível
    const quoteWithVehicleData = {
      ...data,
      vehicles: data.vehicles.map((qv: any) => ({
        ...qv,
        vehicleId: qv.vehicle_id,
        vehicleBrand: qv.vehicle?.brand,
        vehicleModel: qv.vehicle?.model,
        vehicleYear: qv.vehicle?.year,
        vehicleValue: qv.vehicle?.value,
        plateNumber: qv.vehicle?.plate_number,
        vehicleGroupId: qv.vehicle?.group_id,
        totalCost: qv.total_cost,
        monthlyValue: qv.monthly_value,
        depreciationCost: qv.depreciation_cost,
        maintenanceCost: qv.maintenance_cost,
        protectionCost: qv.protection_cost,
        protectionPlanId: qv.protection_plan_id,
        ipvaCost: qv.ipva_cost,
        licensingCost: qv.licensing_cost,
        taxCost: qv.tax_cost,
        includeIpva: qv.include_ipva,
        includeLicensing: qv.include_licensing,
        includeTaxes: qv.include_taxes,
        monthlyKm: qv.monthly_km,
        contractMonths: qv.contract_months,
      }))
    };
    
    return { success: true, quote: quoteWithVehicleData };
  } catch (error) {
    console.error(`Erro inesperado ao buscar orçamento ${id}:`, error);
    return { success: false, error, quote: null };
  }
}

export async function deleteQuoteFromSupabase(id: string) {
  try {
    console.log(`🗑️ Iniciando exclusão do orçamento ${id}...`);
    
    // Primeiro, excluímos os veículos associados ao orçamento
    const { error: vehiclesError } = await supabase
      .from('quote_vehicles')
      .delete()
      .eq('quote_id', id);
    
    if (vehiclesError) {
      console.error(`❌ Erro ao deletar veículos do orçamento ${id}:`, vehiclesError);
      // Continuar mesmo se falhar, pois o orçamento ainda pode ser excluído
    } else {
      console.log(`✅ Veículos do orçamento ${id} excluídos com sucesso`);
    }

    // Registramos para logs antes de deletar
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    // Pausa para garantir que a transação de exclusão dos veículos tenha terminado
    await new Promise(resolve => setTimeout(resolve, 500));

    // Tentamos deletar o orçamento usando a função RPC corrigida
    // Usando any para contornar o problema de tipagem temporariamente
    const { data, error } = await (supabase.rpc as any)('delete_quote', { quote_id: id });

    if (error) {
      console.error(`❌ Erro ao deletar orçamento ${id} via RPC:`, error);
      
      // Plano B: tentar deletar diretamente
      console.log(`⚠️ Tentando excluir diretamente via SQL...`);
      const { error: directError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
        
      if (directError) {
        console.error(`❌ Erro ao deletar orçamento ${id} diretamente:`, directError);
        return { success: false, error: directError };
      }
    }
    
    // Pausa maior para garantir que a exclusão seja concluída
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Verificar se o orçamento foi realmente excluído
    const { data: checkData, error: checkError } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', id);
    
    // Se houver erro na verificação, considerar que a exclusão foi bem-sucedida
    if (checkError) {
      console.log(`⚠️ Não foi possível verificar se o orçamento ${id} foi excluído, mas não houve erros na exclusão:`, checkError);
      return { success: true, deletedQuote: quoteData };
    }
    
    const wasDeleted = !checkData || checkData.length === 0;
    
    if (wasDeleted) {
      console.log(`✅ Orçamento ${id} deletado com sucesso!`);
      return { success: true, deletedQuote: quoteData };
    } else {
      console.error(`❌ Falha ao deletar orçamento ${id}: ainda existe após a exclusão`);
      return { 
        success: false, 
        error: { message: "Orçamento não foi excluído do banco de dados" } 
      };
    }
  } catch (error) {
    console.error(`❌ Erro inesperado ao deletar orçamento ${id}:`, error);
    return { success: false, error };
  }
}

export async function getQuoteVehicles(quoteId: string) {
  try {
    if (!quoteId) {
      return { success: false, error: "ID do orçamento não fornecido", vehicles: [] };
    }
    
    const { data, error } = await supabase
      .from('quote_vehicles')
      .select(`
        *,
        vehicle:vehicle_id(*)
      `)
      .eq('quote_id', quoteId);
      
    if (error) {
      console.error(`Erro ao buscar veículos do orçamento ${quoteId}:`, error);
      return { success: false, error, vehicles: [] };
    }
    
    if (!data || data.length === 0) {
      console.log(`Nenhum veículo encontrado para o orçamento ${quoteId}`);
      return { success: true, vehicles: [] };
    }
    
    // Transformar os dados para incluir informações de veículos de forma mais acessível
    const formattedVehicles = data.map(qv => ({
      id: qv.id,
      vehicle: qv.vehicle,
      vehicle_id: qv.vehicle_id,
      monthly_value: qv.monthly_value,
      contract_months: qv.contract_months,
      monthly_km: qv.monthly_km,
      operation_severity: qv.operation_severity,
      has_tracking: qv.has_tracking,
      include_ipva: qv.include_ipva,
      include_licensing: qv.include_licensing,
      include_taxes: qv.include_taxes,
      protection_plan_id: qv.protection_plan_id,
      protection_cost: qv.protection_cost,
      depreciation_cost: qv.depreciation_cost,
      maintenance_cost: qv.maintenance_cost,
      extra_km_rate: qv.extra_km_rate,
      ipva_cost: qv.ipva_cost,
      licensing_cost: qv.licensing_cost,
      tax_cost: qv.tax_cost,
      total_cost: qv.total_cost
    }));
    
    console.log(`${formattedVehicles.length} veículos recuperados com sucesso para o orçamento ${quoteId}`);
    return { success: true, vehicles: formattedVehicles };
  } catch (error) {
    console.error(`Erro inesperado ao buscar veículos do orçamento ${quoteId}:`, error);
    return { success: false, error, vehicles: [] };
  }
}
