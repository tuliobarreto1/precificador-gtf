
import { supabase } from '../core/client';
import { convertToValidUuid } from './vehicles';

// Função para salvar cliente no Supabase
export async function saveClientToSupabase(client: any) {
  try {
    const clientId = convertToValidUuid(client.id);

    const { data, error } = await supabase
      .from('clients')
      .upsert({
        id: clientId,
        name: client.name,
        document: client.document || null,
        email: client.email || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// Função para buscar cliente por documento
export async function getClientByDocument(document: string) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('document', document)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar cliente por documento:", error);
      return { success: false, error, client: null };
    }

    return { success: true, client: data };
  } catch (error) {
    console.error("Erro inesperado ao buscar cliente por documento:", error);
    return { success: false, error, client: null };
  }
}

// Função para listar todos os clientes
export async function getClientsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Erro ao listar clientes:", error);
      return { success: false, error, clients: [] };
    }

    return { success: true, clients: data || [] };
  } catch (error) {
    console.error("Erro inesperado ao listar clientes:", error);
    return { success: false, error, clients: [] };
  }
}
