
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL não está definida no ambiente. Usando URL de fallback.');
}

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY não está definida no ambiente. Usando chave de fallback.');
}

// Usar URLs de fallback para desenvolvimento se as variáveis de ambiente não estiverem definidas
const fallbackUrl = 'https://pvsjjqmsoauuxxfgdhfg.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2pqcW1zb2F1dXh4ZmdkaGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTI5NTUsImV4cCI6MjA1ODY4ODk1NX0.Mp6zyYRkHfHZTkBIkV_lpYv8nkAkJ9i7cI1y8dGGF6M';

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseKey || fallbackKey
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
