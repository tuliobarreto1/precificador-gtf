
// Importações necessárias
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configurações do Supabase
const SUPABASE_URL = "https://pvsjjqmsoauuxxfgdhfg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2pqcW1zb2F1dXh4ZmdkaGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTI5NTUsImV4cCI6MjA1ODY4ODk1NX0.Mp6zyYRkHfHZTkBIkV_lpYv8nkAkJ9i7cI1y8dGGF6M";

// Criar e exportar o cliente Supabase diretamente
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Adiciona um veículo a um orçamento existente
 */
export async function addVehicleToQuote(quoteId: string, vehicleData: any) {
  try {
    console.log(`Adicionando veículo ao orçamento ${quoteId}:`, vehicleData);

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!quoteId || !uuidRegex.test(quoteId.toString())) {
      throw new Error(`ID de orçamento inválido: ${quoteId}`);
    }
    
    // Preparar dados do veículo
    const quoteVehicle = {
      id: uuidv4(),
      quote_id: quoteId,
      vehicle_id: vehicleData.vehicleId || vehicleData.vehicle?.id,
      monthly_value: vehicleData.monthly_value || vehicleData.totalCost || 0,
      contract_months: vehicleData.contract_months || vehicleData.contractMonths || 12,
      monthly_km: vehicleData.monthly_km || vehicleData.monthlyKm || 2000,
      operation_severity: vehicleData.operation_severity || vehicleData.operationSeverity || 3,
      has_tracking: vehicleData.has_tracking || vehicleData.hasTracking || false,
      depreciation_cost: vehicleData.depreciation_cost || vehicleData.depreciationCost || 0,
      maintenance_cost: vehicleData.maintenance_cost || vehicleData.maintenanceCost || 0,
      extra_km_rate: vehicleData.extra_km_rate || vehicleData.extraKmRate || 0,
      total_cost: vehicleData.total_cost || vehicleData.totalCost || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log("Dados formatados do veículo para salvar:", quoteVehicle);
    
    const { data, error } = await supabase
      .from('quote_vehicles')
      .insert(quoteVehicle)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao adicionar veículo ao orçamento:", error);
      return { success: false, error };
    }
    
    console.log("Veículo adicionado ao orçamento com sucesso:", data);
    return { success: true, quoteVehicle: data };

  } catch (error) {
    console.error("Erro inesperado ao adicionar veículo ao orçamento:", error);
    return { success: false, error };
  }
}

// Verificar a conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('vehicles').select('id').limit(1);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
