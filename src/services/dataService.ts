
import { supabase } from '@/integrations/supabase/client';

// Serviço para buscar dados sem depender de RLS/auth.uid()
export class DataService {
  
  // Buscar orçamentos
  static async getQuotes() {
    try {
      console.log('🔍 Buscando orçamentos...');
      
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
      return { success: true, data };
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar parâmetros de cálculo:', error);
      return { success: false, error, data: null };
    }
  }
}
