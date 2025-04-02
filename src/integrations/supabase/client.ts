
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Função para verificar a conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);
    
    return {
      success: !error,
      data: data,
      error: error
    };
  } catch (err) {
    console.error('Erro ao verificar conexão com o Supabase:', err);
    return {
      success: false,
      error: err
    };
  }
}
