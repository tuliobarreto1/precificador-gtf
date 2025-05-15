
import { supabase } from '@/integrations/supabase/client';
import { QuoteStatusFlow, StatusHistoryItem } from './status-flow';

/**
 * Busca o histórico de alterações de status de um orçamento
 */
export const fetchStatusHistory = async (quoteId: string): Promise<StatusHistoryItem[]> => {
  try {
    console.log(`Buscando histórico de status para orçamento ${quoteId}`);
    
    const { data, error } = await supabase
      .from('quote_status_history')
      .select('*')
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
      user_name: 'Sistema' // Valor padrão
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
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Verifica se o novo status é "draft" e converte para "ORCAMENTO" para compatibilidade com o banco
    const dbStatus = newStatus === 'draft' ? 'ORCAMENTO' : newStatus;
    
    // Buscar o status atual antes da atualização
    const { data: quoteData, error: fetchError } = await supabase
      .from('quotes')
      .select('status_flow')
      .eq('id', quoteId)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar status atual:', fetchError);
      return { success: false, error: fetchError };
    }
    
    const previousStatus = quoteData?.status_flow as QuoteStatusFlow;
    
    // Atualizar o status na tabela de orçamentos
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status_flow: dbStatus })
      .eq('id', quoteId);
    
    if (updateError) {
      console.error('Erro ao atualizar status:', updateError);
      return { success: false, error: updateError };
    }
    
    // Inserir um registro no histórico
    // Antes de salvar no histórico, vamos garantir que o status é compatível com o que o banco espera
    const formattedPreviousStatus = previousStatus === 'draft' ? 'ORCAMENTO' : previousStatus;
    
    // Tratar tipos para prevenir o erro de tipo
    const { error: historyError } = await supabase
      .from('quote_status_history')
      .insert({
        quote_id: quoteId,
        previous_status: formattedPreviousStatus,
        new_status: dbStatus,
        observation: observation || null
      } as any); // Usando 'as any' para contornar a verificação de tipo estrita
    
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
