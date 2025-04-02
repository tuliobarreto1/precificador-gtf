
import { supabase } from '../client';

export async function createQuoteActionLog(data: {
  quote_id: string;
  quote_title: string | null;
  action_type: string;
  user_id: string;
  user_name: string;
  action_date?: string;
  details?: any;
  deleted_data?: any;
}) {
  try {
    const { error } = await supabase
      .rpc('insert_quote_action_log', {
        quote_id: data.quote_id,
        quote_title: data.quote_title,
        action_type: data.action_type,
        user_id: data.user_id,
        user_name: data.user_name,
        action_date: data.action_date || new Date().toISOString(),
        details: data.details || null,
        deleted_data: data.deleted_data || null
      });
      
    if (error) {
      console.error("Erro ao criar log de ação:", error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro inesperado ao criar log de ação:", error);
    return { success: false, error };
  }
}

export async function getQuoteActionLogs(quoteId?: string) {
  try {
    if (quoteId) {
      const { data, error } = await supabase
        .rpc('get_quote_action_logs_by_quote', {
          quote_id_param: quoteId
        });
        
      if (error) {
        console.error("Erro ao buscar logs de ação:", error);
        return { success: false, error, logs: [] };
      }
      
      return { success: true, logs: data || [] };
    } else {
      const { data, error } = await supabase
        .rpc('get_all_quote_action_logs');
        
      if (error) {
        console.error("Erro ao buscar todos os logs de ação:", error);
        return { success: false, error, logs: [] };
      }
      
      return { success: true, logs: data || [] };
    }
  } catch (error) {
    console.error("Erro inesperado ao buscar logs de ação:", error);
    return { success: false, error, logs: [] };
  }
}
