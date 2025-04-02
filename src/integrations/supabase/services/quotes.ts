
import { supabase } from '../client';

// Função para buscar logs de ações nos orçamentos
export async function getQuoteActionLogs(quoteId?: string) {
  try {
    // Usar as funções RPC criadas para buscar os logs
    let result;
    
    if (quoteId) {
      result = await supabase
        .rpc('get_quote_action_logs_by_quote', { quote_id_param: quoteId });
    } else {
      result = await supabase
        .rpc('get_all_quote_action_logs');
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error("Erro ao buscar logs de ações:", error);
      return { success: false, error, logs: [] };
    }
    
    return { success: true, logs: data || [] };
  } catch (error) {
    console.error("Erro ao buscar logs de ações:", error);
    return { success: false, error, logs: [] };
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

// Função para salvar um orçamento no Supabase
export async function saveQuoteToSupabase(quoteData: any) {
  try {
    console.log("Iniciando salvamento de orçamento:", quoteData);
    
    // Formatação simplificada para lidar com os erros atuais
    const quoteToSave = {
      id: quoteData.id,
      title: quoteData.title || `Orçamento ${new Date().toLocaleDateString()}`,
      client_id: typeof quoteData.clientId === 'object' ? null : quoteData.clientId,
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

// Função para excluir um orçamento e registrar esta ação
export async function deleteQuoteFromSupabase(quoteId: string, userId?: string, userName?: string) {
  try {
    if (!quoteId) {
      return { success: false, error: "ID do orçamento não fornecido" };
    }

    // Primeiro, buscar os dados do orçamento para registro no log
    const { quote, error: fetchError } = await getQuoteByIdFromSupabase(quoteId);
    
    if (fetchError) {
      console.error("Erro ao buscar orçamento para exclusão:", fetchError);
      return { success: false, error: fetchError };
    }

    // Registrar ação de exclusão no log
    const logEntry = {
      quote_id: quoteId,
      user_id: userId || null,
      user_name: userName || "Sistema",
      action_type: "DELETE",
      action_date: new Date().toISOString(),
      quote_title: quote?.title || "Orçamento sem título",
      deleted_data: quote || null
    };
    
    const { error: logError } = await supabase
      .from('quote_action_logs')
      .insert(logEntry);
      
    if (logError) {
      console.error("Erro ao registrar log de exclusão:", logError);
      // Continuar com a exclusão mesmo com erro no log
    }
    
    // Excluir primeiro os veículos do orçamento (para manter integridade referencial)
    const { error: vehiclesDeleteError } = await supabase
      .from('quote_vehicles')
      .delete()
      .eq('quote_id', quoteId);
      
    if (vehiclesDeleteError) {
      console.error("Erro ao excluir veículos do orçamento:", vehiclesDeleteError);
      return { success: false, error: vehiclesDeleteError };
    }

    // Então excluir o orçamento
    const { error: quoteDeleteError } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);
      
    if (quoteDeleteError) {
      console.error("Erro ao excluir orçamento:", quoteDeleteError);
      return { success: false, error: quoteDeleteError };
    }
    
    console.log(`Orçamento ${quoteId} excluído com sucesso`);
    return { success: true };
  } catch (error) {
    console.error("Erro inesperado ao excluir orçamento:", error);
    return { success: false, error };
  }
}
