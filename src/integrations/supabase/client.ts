import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = "https://pvsjjqmsoauuxxfgdhfg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2pqcW1zb2F1dXh4ZmdkaGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMTI5NTUsImV4cCI6MjA1ODY4ODk1NX0.Mp6zyYRkHfHZTkBIkV_lpYv8nkAkJ9i7cI1y8dGGF6M";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true
  }
});

// Funções de conexão
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('vehicles').select('id').limit(1);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// Função para buscar veículos
export async function getVehiclesFromSupabase() {
  try {
    console.log("Buscando veículos do Supabase...");
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('brand', { ascending: true });
      
    if (error) throw error;
    return { success: true, vehicles: data || [] };
  } catch (error) {
    console.error("Erro ao buscar veículos:", error);
    return { success: false, error, vehicles: [] };
  }
}

// Função para adicionar veículo ao orçamento
export async function addVehicleToQuote(quoteId: string, vehicleData: any) {
  try {
    // Sempre criar um novo veículo
    const vehicleId = uuidv4();
    const vehicleToCreate = {
      id: vehicleId,
      brand: vehicleData.brand || vehicleData.vehicle?.brand || 'Não especificado',
      model: vehicleData.model || vehicleData.vehicle?.model || 'Não especificado',
      year: vehicleData.year || vehicleData.vehicle?.year || new Date().getFullYear(),
      value: vehicleData.value || vehicleData.vehicle?.value || 0,
      plate_number: vehicleData.plateNumber || vehicleData.vehicle?.plateNumber || null,
      is_used: !!vehicleData.plateNumber || !!vehicleData.vehicle?.plateNumber || false,
      group_id: vehicleData.groupId || vehicleData.vehicle?.groupId || 'A',
      color: vehicleData.color || vehicleData.vehicle?.color || null,
      fuel_type: vehicleData.fuelType || vehicleData.vehicle?.fuelType || 'Flex'
    };

    // Inserir novo veículo
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .insert(vehicleToCreate);

    if (vehicleError) {
      throw vehicleError;
    }

    // Criar vínculo com o orçamento
    const quoteVehicleData = {
      id: uuidv4(),
      quote_id: quoteId,
      vehicle_id: vehicleId,
      monthly_value: vehicleData.monthly_value || 0,
      monthly_km: vehicleData.monthly_km || 2000,
      contract_months: vehicleData.contract_months || 12,
      operation_severity: vehicleData.operation_severity || 3,
      has_tracking: vehicleData.has_tracking || false,
      total_cost: vehicleData.monthly_value || 0
    };

    const { error: linkError } = await supabase
      .from('quote_vehicles')
      .insert(quoteVehicleData);

    if (linkError) {
      throw linkError;
    }

    return { success: true, data: { vehicleId, quoteId } };
  } catch (error) {
    console.error('Erro ao adicionar veículo:', error);
    return { success: false, error };
  }
}

// Função para salvar cliente
export async function saveClientToSupabase(client: any) {
  try {
    const clientId = uuidv4();
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

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// Função para buscar veículos de um orçamento
export async function getQuoteVehicles(quoteId: string) {
  try {
    const { data, error } = await supabase
      .from('quote_vehicles')
      .select(`
        id,
        quote_id,
        vehicle_id,
        monthly_value,
        monthly_km,
        contract_months,
        operation_severity,
        has_tracking,
        total_cost,
        vehicle:vehicle_id(*)
      `)
      .eq('quote_id', quoteId);

    if (error) throw error;
    return { success: true, vehicles: data || [] };
  } catch (error) {
    return { success: false, error, vehicles: [] };
  }
}
