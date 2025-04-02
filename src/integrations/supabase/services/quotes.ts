
import { supabase } from '../core/client';
import { v4 as uuidv4 } from 'uuid';

// Função para salvar um orçamento no Supabase
export async function saveQuoteToSupabase(quoteData: any) {
  try {
    console.log("Iniciando salvamento de orçamento:", quoteData);
    
    // Garantir que o quoteId seja um UUID válido
    // Se o ID for um número (timestamp) ou não for um formato UUID válido, gerar um novo
    let quoteId = quoteData.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!quoteId || !uuidRegex.test(quoteId.toString())) {
      quoteId = uuidv4();
      console.log("ID não é um UUID válido, gerando novo ID:", quoteId);
    }
    
    // Validar e certificar que campos críticos são do tipo correto
    // Certifique-se de que os IDs estão no formato apropriado para UUID
    const quoteToSave = {
      id: quoteId,
      title: quoteData.title || `Orçamento ${new Date().toLocaleDateString()}`,
      client_id: typeof quoteData.clientId === 'object' ? null : quoteData.clientId,
      vehicle_id: typeof quoteData.vehicleId === 'object' ? null : quoteData.vehicleId,
      contract_months: quoteData.contractMonths || 12,
      monthly_km: quoteData.monthlyKm || 2000,
      operation_severity: quoteData.operationSeverity || 3,
      has_tracking: quoteData.hasTracking || false,
      total_value: quoteData.totalCost || 0,
      monthly_values: quoteData.monthlyValue || 0,
      status: quoteData.status || 'ORCAMENTO',
      status_flow: quoteData.statusFlow || 'ORCAMENTO',
      created_by: typeof quoteData.createdBy === 'object' ? null : quoteData.createdBy,
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
    
    // Se temos veículos para salvar no orçamento
    if (quoteData.vehicles && Array.isArray(quoteData.vehicles) && quoteData.vehicles.length > 0) {
      try {
        // Importar a função de adicionar veículo ao orçamento
        const { addVehicleToQuote } = await import('../client');
        
        // Adicionar cada veículo ao orçamento
        for (const vehicle of quoteData.vehicles) {
          await addVehicleToQuote(quoteId, {
            ...vehicle,
            monthly_value: vehicle.totalCost || 0,
            monthly_km: quoteData.monthlyKm || 2000,
            contract_months: quoteData.contractMonths || 12,
            operation_severity: quoteData.operationSeverity || 3,
            has_tracking: quoteData.hasTracking || false
          });
        }
        console.log("Veículos adicionados ao orçamento com sucesso");
      } catch (vehicleError) {
        console.error("Erro ao adicionar veículos ao orçamento:", vehicleError);
        // Não falhar o processo principal se os veículos falharem
      }
    }
    
    return { success: true, quote: data };
  } catch (error) {
    console.error("Erro inesperado ao salvar orçamento:", error);
    return { success: false, error };
  }
}

// Função para obter todos os orçamentos
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

// Função para buscar um orçamento pelo ID
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
    
    console.log(`Orçamento ${id} recuperado com sucesso`);
    return { success: true, quote: data };
  } catch (error) {
    console.error(`Erro inesperado ao buscar orçamento ${id}:`, error);
    return { success: false, error, quote: null };
  }
}

// Função para deletar um orçamento
export async function deleteQuoteFromSupabase(id: string) {
  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erro ao deletar orçamento ${id}:`, error);
      return { success: false, error };
    }
    
    console.log(`Orçamento ${id} deletado com sucesso`);
    return { success: true };
  } catch (error) {
    console.error(`Erro inesperado ao deletar orçamento ${id}:`, error);
    return { success: false, error };
  }
}
