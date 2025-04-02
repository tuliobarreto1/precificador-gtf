
import { supabase } from '../client';

// Função para executar SQL personalizado no Supabase
export async function executeSQL(sql: string, params?: any[]) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sql,
      params: params || []
    });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    return { success: false, error };
  }
}
