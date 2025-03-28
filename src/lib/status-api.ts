
import { supabase } from '@/integrations/supabase/client';
import { StatusHistoryItem, QuoteStatusFlow } from './status-flow';

// Função para buscar histórico de status de um orçamento
export async function fetchStatusHistory(quoteId: string): Promise<StatusHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('quote_status_history')
      .select(`
        *,
        users:changed_by(name)
      `)
      .eq('quote_id', quoteId)
      .order('changed_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar histórico de status:', error);
      throw error;
    }
    
    // Processar os dados para o formato esperado
    const historyItems: StatusHistoryItem[] = data.map((item: any) => ({
      id: item.id,
      quote_id: item.quote_id,
      previous_status: item.previous_status as QuoteStatusFlow | null,
      new_status: item.new_status as QuoteStatusFlow,
      changed_by: item.changed_by,
      changed_at: item.changed_at,
      observation: item.observation,
      user_name: item.users?.name
    }));
    
    return historyItems;
  } catch (error) {
    console.error('Erro ao buscar histórico de status:', error);
    return [];
  }
}

// Função para atualizar o status de um orçamento
export async function updateQuoteStatus(
  quoteId: string, 
  newStatus: QuoteStatusFlow, 
  observation?: string
): Promise<boolean> {
  try {
    // Atualizar o status
    const { error } = await supabase
      .from('quotes')
      .update({ status_flow: newStatus })
      .eq('id', quoteId);
    
    if (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
    
    // Se houver observação, adicionar manualmente ao histórico
    if (observation) {
      const { error: historyError } = await supabase
        .from('quote_status_history')
        .insert({
          quote_id: quoteId,
          new_status: newStatus,
          observation: observation
        });
      
      if (historyError) {
        console.error('Erro ao adicionar observação ao histórico:', historyError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
}

// Função para buscar resumo dos status
export async function fetchStatusSummary(): Promise<Record<QuoteStatusFlow, number>> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('status_flow, count')
      .select();
    
    if (error) {
      console.error('Erro ao buscar resumo de status:', error);
      throw error;
    }
    
    // Criar um objeto com a contagem de cada status
    const summary: Record<QuoteStatusFlow, number> = {} as Record<QuoteStatusFlow, number>;
    
    // Inicializar todos os status com zero
    Object.values(QuoteStatusFlow).forEach(status => {
      summary[status] = 0;
    });
    
    // Preencher com os dados obtidos
    data.forEach((item: any) => {
      if (item.status_flow) {
        summary[item.status_flow as QuoteStatusFlow] += 1;
      }
    });
    
    return summary;
  } catch (error) {
    console.error('Erro ao buscar resumo de status:', error);
    return {} as Record<QuoteStatusFlow, number>;
  }
}
