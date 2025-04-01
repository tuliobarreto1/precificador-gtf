
import { supabase } from '../core/client';
import { v4 as uuidv4 } from 'uuid';

// Função para salvar um orçamento no Supabase
export async function saveQuoteToSupabase(quoteData: any) {
  try {
    console.log("Iniciando salvamento de orçamento:", quoteData);
    
    const quoteId = quoteData.id || uuidv4();
    
    const quoteToSave = {
      id: quoteId,
      title: quoteData.title || `Orçamento ${new Date().toLocaleDateString()}`,
      client_id: quoteData.clientId,
      vehicle_id: quoteData.vehicleId,
      contract_months: quoteData.contractMonths || 12,
      monthly_km: quoteData.monthlyKm || 2000,
      operation_severity: quoteData.operationSeverity || 3,
      has_tracking: quoteData.hasTracking || false,
      total_value: quoteData.totalCost || 0,
      monthly_values: quoteData.monthlyValue || 0,
      status: quoteData.status || 'ORCAMENTO',
      status_flow: quoteData.statusFlow || 'ORCAMENTO',
      created_by: quoteData.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
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
