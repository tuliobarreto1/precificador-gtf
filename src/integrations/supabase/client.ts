
import { createClient } from '@/integrations/supabase/supabase-browser';

const SUPABASE_URL = 'https://pvsjjqmsoauuxxfgdhfg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2pqcW1zb2F1dXh4ZmdkaGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTI5NTUsImV4cCI6MjA1ODY4ODk1NX0.Mp6zyYRkHfHZTkBIkV_lpYv8nkAkJ9i7cI1y8dGGF6M';

// Criar e exportar a instância do Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para verificar a conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    console.log('Verificando conexão com o Supabase...');
    console.log(`URL do Supabase configurada: ${SUPABASE_URL}`);
    console.log(`Chave anônima configurada: ${SUPABASE_ANON_KEY ? 'Sim (escondida)' : 'Não'}`);
    
    // Tentar fazer uma consulta simples para verificar a conexão
    const { data, error } = await supabase
      .from('system_settings')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao verificar conexão com o Supabase:', error);
      return {
        connected: false,
        error: error.message
      };
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso');
    return {
      connected: true,
      message: 'Conexão com o Supabase estabelecida com sucesso'
    };
  } catch (error) {
    console.error('Erro ao verificar conexão com o Supabase:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
