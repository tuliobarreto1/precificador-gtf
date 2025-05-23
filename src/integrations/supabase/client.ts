
import { createClient } from '@/integrations/supabase/supabase-browser';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lklccqyojapgmqeeazld.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbGNjcXlvamFwZ21xZWVhemxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyNTk4NjMsImV4cCI6MjAwNDgzNTg2M30.-1jtHRgT0yQ3DEwJPsywJJim5KEDdM7CIdTLybZjXxk';

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
