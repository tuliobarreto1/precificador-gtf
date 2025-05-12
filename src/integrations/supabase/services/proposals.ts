
import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface GeneratedProposal {
  id: string;
  quote_id: string;
  file_name: string;
  file_url?: string;
  generated_at: string;
  generated_by?: string;
  status: string;
  observation?: string;
  sent_to?: string;
  sent_at?: string;
}

/**
 * Busca propostas geradas para um orçamento específico
 */
export async function getProposalsByQuoteId(quoteId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_proposals')
      .select('*')
      .eq('quote_id', quoteId)
      .order('generated_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar propostas:', error);
      return { success: false, error, proposals: [] };
    }
    
    return { success: true, proposals: data as GeneratedProposal[] };
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    return { success: false, error, proposals: [] };
  }
}

/**
 * Registra uma nova proposta gerada
 */
export async function registerProposal(proposalData: Partial<GeneratedProposal>) {
  try {
    const { data, error } = await supabase
      .from('generated_proposals')
      .insert({
        id: proposalData.id || uuidv4(),
        quote_id: proposalData.quote_id,
        file_name: proposalData.file_name || `Proposta_${new Date().toISOString().split('T')[0]}.pdf`,
        file_url: proposalData.file_url,
        status: proposalData.status || 'GERADA',
        observation: proposalData.observation,
        generated_by: proposalData.generated_by
      })
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao registrar proposta:', error);
      return { success: false, error };
    }
    
    return { success: true, proposal: data as GeneratedProposal };
  } catch (error) {
    console.error('Erro ao registrar proposta:', error);
    return { success: false, error };
  }
}

/**
 * Marca uma proposta como enviada
 */
export async function markProposalAsSent(proposalId: string, sentTo: string) {
  try {
    const { data, error } = await supabase
      .from('generated_proposals')
      .update({
        sent_to: sentTo,
        sent_at: new Date().toISOString(),
        status: 'ENVIADA'
      })
      .eq('id', proposalId)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao marcar proposta como enviada:', error);
      return { success: false, error };
    }
    
    return { success: true, proposal: data as GeneratedProposal };
  } catch (error) {
    console.error('Erro ao marcar proposta como enviada:', error);
    return { success: false, error };
  }
}
