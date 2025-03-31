
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
