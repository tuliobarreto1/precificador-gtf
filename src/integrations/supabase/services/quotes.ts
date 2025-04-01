import { supabase } from '../core/client';
import { saveClientToSupabase, getClientByDocument } from './clients';
import { v4 as uuidv4 } from 'uuid';

// Função para salvar orçamento no Supabase
export async function saveQuoteToSupabase(quote: any) {
  try {
    console.log("Iniciando salvamento de orçamento:", quote);
    
    // Obter usuário atual
    let userId = null;
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      userId = JSON.parse(adminUserStr).id;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }

    // Verificar se o cliente já existe pelo documento
    let clientResult;
    if (quote.client?.document) {
      console.log("Verificando cliente pelo documento:", quote.client.document);
      const { client: existingClient } = await getClientByDocument(quote.client.document);
      
      if (existingClient) {
        console.log("Cliente encontrado, usando existente:", existingClient);
        clientResult = { success: true, data: existingClient };
      } else {
        console.log("Cliente não encontrado, criando novo...");
        clientResult = await saveClientToSupabase({
          ...quote.client,
          type: quote.client.type || 'PF',  // Garantir que o tipo está definido
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } else {
      console.log("Cliente sem documento, criando novo...");
      clientResult = await saveClientToSupabase({
        ...quote.client,
        type: quote.client.type || 'PF',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (!clientResult.success) {
      console.error("Erro ao processar cliente:", clientResult.error);
      return { success: false, error: clientResult.error };
    }

    // Preparar dados do orçamento
    const quoteId = quote.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(quote.id)
      ? quote.id 
      : uuidv4();

    const quoteData = {
      id: quoteId,
      client_id: clientResult.data.id,
      contract_months: quote.contractMonths || quote.globalParams?.contractMonths || 12,
      monthly_km: quote.monthlyKm || quote.globalParams?.monthlyKm || 2000,
      operation_severity: quote.operationSeverity || quote.globalParams?.operationSeverity || 3,
      has_tracking: quote.hasTracking || quote.globalParams?.hasTracking || false,
      total_value: quote.totalCost || 0,
      status: 'active',
      title: quote.title || `Orçamento ${new Date().toLocaleDateString('pt-BR')}`,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Salvar orçamento
    const { error: quoteError } = await supabase
      .from('quotes')
      .upsert(quoteData)
      .select();

    if (quoteError) {
      console.error("Erro ao salvar orçamento:", quoteError);
      return { success: false, error: quoteError };
    }

    // Processar veículos se houver
    if (quote.vehicles?.length > 0) {
      // Limpar associações existentes se for atualização
      if (quote.id) {
        await supabase
          .from('quote_vehicles')
          .delete()
          .eq('quote_id', quoteId);
      }

      // Processar cada veículo em paralelo
      const processPromises = quote.vehicles.map(async (vehicleItem: any) => {
        try {
          // Criar novo veículo
          const vehicleData = {
            id: uuidv4(),
            brand: vehicleItem.vehicleBrand || vehicleItem.brand || 'Não especificado',
            model: vehicleItem.vehicleModel || vehicleItem.model || 'Não especificado',
            year: parseInt(String(vehicleItem.year)) || new Date().getFullYear(),
            value: parseFloat(String(vehicleItem.value)) || 0,
            plate_number: vehicleItem.plateNumber || null,
            is_used: !!vehicleItem.plateNumber || false,
            group_id: vehicleItem.groupId || 'A',
            color: vehicleItem.color || null,
            odometer: parseInt(String(vehicleItem.odometer)) || 0,
            fuel_type: vehicleItem.fuelType || 'Flex',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Inserir veículo
          const { data: newVehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .insert(vehicleData)
            .select();

          if (vehicleError || !newVehicle?.length) {
            throw new Error('Falha ao criar veículo');
          }

          // Criar associação quote_vehicle
          const quoteVehicleData = {
            id: uuidv4(),
            quote_id: quoteId,
            vehicle_id: newVehicle[0].id,
            monthly_value: vehicleItem.monthlyValue || quote.totalCost / quote.vehicles.length,
            monthly_km: quote.monthlyKm || 2000,
            contract_months: quote.contractMonths || 12,
            operation_severity: quote.operationSeverity || 3,
            has_tracking: quote.hasTracking || false,
            total_cost: vehicleItem.monthlyValue || quote.totalCost / quote.vehicles.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await supabase
            .from('quote_vehicles')
            .insert(quoteVehicleData);

          return true;
        } catch (error) {
          console.error("Erro ao processar veículo:", error);
          return false;
        }
      });

      await Promise.all(processPromises);
    }

    return { success: true, data: [{ id: quoteId }] };
  } catch (error) {
    console.error("Erro ao salvar orçamento:", error);
    return { success: false, error };
  }
}

// Função para buscar orçamentos
export async function getQuotesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`*, client:client_id(*)`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Buscar veículos para cada orçamento
    const quotes = Array.isArray(data) ? data : [];
    for (const quote of quotes) {
      const { data: vehiclesData } = await supabase
        .from('quote_vehicles')
        .select(`*, vehicle:vehicle_id(*)`)
        .eq('quote_id', quote.id);
        
      (quote as any).vehicles = vehiclesData || [];
    }

    return { success: true, quotes };
  } catch (error) {
    return { success: false, error, quotes: [] };
  }
}

// Função para buscar um orçamento específico
export async function getQuoteByIdFromSupabase(quoteId: string) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`*, client:client_id(*)`)
      .eq('id', quoteId)
      .single();

    if (error) {
      return { success: false, error };
    }

    if (data) {
      const { data: vehiclesData } = await supabase
        .from('quote_vehicles')
        .select(`*, vehicle:vehicle_id(*)`)
        .eq('quote_id', quoteId);

      (data as any).vehicles = vehiclesData || [];
    }

    return { success: true, quote: data };
  } catch (error) {
    return { success: false, error };
  }
}
