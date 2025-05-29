
import { supabase } from '@/integrations/supabase/client';

// Serviço para buscar dados sem depender de RLS/auth.uid()
export class DataService {
  
  // Buscar orçamentos
  static async getQuotes() {
    try {
      console.log('🔍 Buscando orçamentos via DataService...');
      
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          client_id,
          total_value,
          created_at,
          status,
          status_flow,
          contract_months,
          created_by,
          clients (
            id,
            name
          ),
          quote_vehicles (
            *,
            vehicle_id,
            vehicles:vehicle_id (
              brand,
              model
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar orçamentos:', error);
        return { success: false, error, data: [] };
      }

      console.log(`✅ ${data?.length || 0} orçamentos encontrados`);
      console.log('📊 Dados dos orçamentos:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar orçamentos:', error);
      return { success: false, error, data: [] };
    }
  }

  // Buscar grupos de veículos
  static async getVehicleGroups() {
    try {
      console.log('🔍 Buscando grupos de veículos...');
      
      const { data, error } = await supabase
        .from('vehicle_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar grupos de veículos:', error);
        return { success: false, error, data: [] };
      }

      console.log(`✅ ${data?.length || 0} grupos de veículos encontrados`);
      console.log('📊 Grupos de veículos:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar grupos de veículos:', error);
      return { success: false, error, data: [] };
    }
  }

  // Buscar veículos
  static async getVehicles() {
    try {
      console.log('🔍 Buscando veículos...');
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('brand', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar veículos:', error);
        return { success: false, error, data: [] };
      }

      console.log(`✅ ${data?.length || 0} veículos encontrados`);
      console.log('📊 Veículos:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar veículos:', error);
      return { success: false, error, data: [] };
    }
  }

  // Buscar clientes
  static async getClients() {
    try {
      console.log('🔍 Buscando clientes...');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        return { success: false, error, data: [] };
      }

      console.log(`✅ ${data?.length || 0} clientes encontrados`);
      console.log('📊 Clientes:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar clientes:', error);
      return { success: false, error, data: [] };
    }
  }

  // Buscar parâmetros de cálculo
  static async getCalculationParams() {
    try {
      console.log('🔍 Buscando parâmetros de cálculo...');
      
      const { data, error } = await supabase
        .from('calculation_params')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar parâmetros de cálculo:', error);
        return { success: false, error, data: null };
      }

      console.log('✅ Parâmetros de cálculo encontrados');
      console.log('📊 Parâmetros:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar parâmetros de cálculo:', error);
      return { success: false, error, data: null };
    }
  }

  // Buscar usuários do sistema
  static async getSystemUsers() {
    try {
      console.log('🔍 Buscando usuários do sistema...');
      
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar usuários do sistema:', error);
        return { success: false, error, data: [] };
      }

      console.log(`✅ ${data?.length || 0} usuários do sistema encontrados`);
      console.log('📊 Usuários:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar usuários do sistema:', error);
      return { success: false, error, data: [] };
    }
  }

  // Testar conexão com o Supabase
  static async testConnection() {
    try {
      console.log('🔄 Testando conexão com Supabase...');
      
      // Testar com uma consulta simples na tabela system_users
      const { data, error } = await supabase
        .from('system_users')
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error('❌ Erro na conexão:', error);
        return { success: false, error };
      }

      console.log('✅ Conexão com Supabase OK');
      console.log('📊 Resultado do teste:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro inesperado na conexão:', error);
      return { success: false, error };
    }
  }

  // Criar orçamento
  static async createQuote(quoteData: any) {
    try {
      console.log('🔄 Criando novo orçamento...');
      console.log('📊 Dados do orçamento:', quoteData);
      
      const { data, error } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar orçamento:', error);
        return { success: false, error, data: null };
      }

      console.log('✅ Orçamento criado com sucesso');
      console.log('📊 Orçamento criado:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro inesperado ao criar orçamento:', error);
      return { success: false, error, data: null };
    }
  }

  // Atualizar orçamento
  static async updateQuote(quoteId: string, updates: any) {
    try {
      console.log(`🔄 Atualizando orçamento ${quoteId}...`);
      console.log('📊 Updates:', updates);
      
      const { data, error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', quoteId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar orçamento:', error);
        return { success: false, error, data: null };
      }

      console.log('✅ Orçamento atualizado com sucesso');
      console.log('📊 Orçamento atualizado:', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro inesperado ao atualizar orçamento:', error);
      return { success: false, error, data: null };
    }
  }

  // Deletar orçamento
  static async deleteQuote(quoteId: string) {
    try {
      console.log(`🗑️ Deletando orçamento ${quoteId}...`);
      
      // Primeiro deletar os veículos relacionados
      const { error: vehiclesError } = await supabase
        .from('quote_vehicles')
        .delete()
        .eq('quote_id', quoteId);

      if (vehiclesError) {
        console.error('❌ Erro ao deletar veículos do orçamento:', vehiclesError);
        return { success: false, error: vehiclesError };
      }

      // Depois deletar o orçamento
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('❌ Erro ao deletar orçamento:', error);
        return { success: false, error };
      }

      console.log('✅ Orçamento deletado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('💥 Erro inesperado ao deletar orçamento:', error);
      return { success: false, error };
    }
  }
}
