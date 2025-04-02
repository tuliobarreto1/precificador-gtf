import { supabase } from '@/integrations/supabase/client';
import { QuoteStatusFlow, StatusHistoryItem } from './status-flow';

/**
 * Busca o histórico de alterações de status de um orçamento
 */
export const fetchStatusHistory = async (quoteId: string): Promise<StatusHistoryItem[]> => {
  try {
    console.log(`Buscando histórico de status para orçamento ${quoteId}`);
    
    // Removendo a tentativa de join com profiles, pois não temos esta relação configurada
    const { data, error } = await supabase
      .from('quote_status_history')
      .select(`
        id,
        quote_id,
        previous_status,
        new_status,
        changed_by,
        changed_at,
        observation
      `)
      .eq('quote_id', quoteId)
      .order('changed_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar histórico de status:', error);
      return [];
    }
    
    // Converter os dados para o formato esperado pelo StatusHistoryItem
    return (data || []).map(item => ({
      id: item.id,
      quote_id: item.quote_id,
      previous_status: item.previous_status as QuoteStatusFlow,
      new_status: item.new_status as QuoteStatusFlow,
      changed_by: item.changed_by,
      changed_at: item.changed_at,
      observation: item.observation,
      user_name: undefined // Não temos essa informação no momento
    }));
  } catch (error) {
    console.error('Erro ao buscar histórico de status:', error);
    return [];
  }
};

/**
 * Atualiza o status de um orçamento
 */
export const updateQuoteStatus = async (
  quoteId: string, 
  newStatus: QuoteStatusFlow, 
  observation?: string
) => {
  try {
    // Atualizar o status na tabela de orçamentos
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status_flow: newStatus })
      .eq('id', quoteId);
    
    if (updateError) {
      console.error('Erro ao atualizar status:', updateError);
      return { success: false, error: updateError };
    }
    
    // Inserir um registro no histórico manualmente (já que o trigger pode não estar funcionando)
    const { error: historyError } = await supabase
      .from('quote_status_history')
      .insert({
        quote_id: quoteId,
        new_status: newStatus,
        observation: observation || null
      });
    
    if (historyError) {
      console.error('Erro ao salvar histórico de status:', historyError);
      // Não vamos falhar a operação só porque o histórico falhou
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error };
  }
};
