
import { supabase } from '@/integrations/supabase';
import { Client, Vehicle, VehicleGroup, Quote, savedQuotes, ClientType } from './models';

// Funções para clientes
export async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
      
    if (error || !data) {
      console.error("Erro ao buscar clientes do Supabase:", error);
      return []; // Retornar array vazio em vez de dados mockados
    }
    
    // Mapear os dados do Supabase para o formato Client
    return data.map(client => ({
      id: client.id,
      name: client.name,
      type: (client.type === 'PF' || client.type === 'PJ') ? client.type as ClientType : 'PJ' as ClientType,
      document: client.document || '',
      email: client.email,
      contact: client.phone,
      responsible: client.responsible_person
    }));
  } catch (error) {
    console.error("Erro inesperado ao buscar clientes:", error);
    return []; // Retornar array vazio em vez de dados mockados
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!id) return null;
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error("Erro ao buscar cliente por ID:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: (data.type === 'PF' || data.type === 'PJ') ? data.type as ClientType : 'PJ' as ClientType,
      document: data.document || '',
      email: data.email,
      contact: data.phone,
      responsible: data.responsible_person
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar cliente por ID:", error);
    return null;
  }
}

export async function addClient(client: Client): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        type: client.type,
        document: client.document,
        email: client.email,
        phone: client.contact,
        responsible_person: client.responsible
      })
      .select()
      .single();
    
    if (error || !data) {
      console.error("Erro ao adicionar cliente:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: data.type as ClientType,
      document: data.document || '',
      email: data.email,
      contact: data.phone,
      responsible: data.responsible_person
    };
  } catch (error) {
    console.error("Erro inesperado ao adicionar cliente:", error);
    return null;
  }
}

export async function getClientByDocument(document: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('document', document)
      .single();
    
    if (error || !data) {
      console.error("Erro ao buscar cliente por documento:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: data.type as ClientType,
      document: data.document || '',
      email: data.email,
      contact: data.phone,
      responsible: data.responsible_person
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar cliente por documento:", error);
    return null;
  }
}

// Funções para veículos
export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
      
    if (error || !data) {
      console.error("Erro ao buscar veículos do Supabase:", error);
      return []; // Retornar array vazio em vez de dados mockados
    }
    
    // Mapear os dados do Supabase para o formato Vehicle
    return data.map(vehicle => ({
      id: vehicle.id,
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      value: vehicle.value || 0,
      isUsed: vehicle.is_used || false,
      plateNumber: vehicle.plate_number,
      color: vehicle.color,
      odometer: vehicle.odometer,
      fuelType: vehicle.fuel_type,
      groupId: vehicle.group_id || 'A'
    }));
  } catch (error) {
    console.error("Erro inesperado ao buscar veículos:", error);
    return []; // Retornar array vazio em vez de dados mockados
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  if (!id) return null;
  
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error("Erro ao buscar veículo por ID:", error);
      return null;
    }
    
    return {
      id: data.id,
      brand: data.brand || '',
      model: data.model || '',
      year: data.year || new Date().getFullYear(),
      value: data.value || 0,
      isUsed: data.is_used || false,
      plateNumber: data.plate_number,
      color: data.color,
      odometer: data.odometer,
      fuelType: data.fuel_type,
      groupId: data.group_id || 'A'
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar veículo por ID:", error);
    return null;
  }
}

// Funções para grupos de veículos
export async function getVehicleGroups(): Promise<VehicleGroup[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*');
      
    if (error || !data) {
      console.error("Erro ao buscar grupos de veículos do Supabase:", error);
      return []; // Retornar array vazio em vez de dados mockados
    }
    
    // Mapear os dados do Supabase para o formato VehicleGroup
    return data.map(group => ({
      id: group.code,
      name: group.name,
      description: group.description || '',
      revisionKm: group.revision_km || 10000,
      revisionCost: group.revision_cost || 500,
      tireKm: group.tire_km || 40000,
      tireCost: group.tire_cost || 2000
    }));
  } catch (error) {
    console.error("Erro inesperado ao buscar grupos de veículos:", error);
    return []; // Retornar array vazio em vez de dados mockados
  }
}

export async function getVehicleGroupById(id: string): Promise<VehicleGroup | null> {
  if (!id) return null;
  
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .eq('code', id)
      .single();
    
    if (error || !data) {
      console.error("Erro ao buscar grupo de veículo por ID:", error);
      return null;
    }
    
    return {
      id: data.code,
      name: data.name,
      description: data.description || '',
      revisionKm: data.revision_km || 10000,
      revisionCost: data.revision_cost || 500,
      tireKm: data.tire_km || 40000,
      tireCost: data.tire_cost || 2000
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar grupo de veículo por ID:", error);
    return null;
  }
}

// Função para orçamentos - apenas usando Supabase
export async function getQuotes(): Promise<Quote[]> {
  try {
    const { quotes, success, error } = await import('@/integrations/supabase').then(m => m.getQuotesFromSupabase());
    
    if (!success || !quotes || quotes.length === 0) {
      console.error("Erro ao buscar orçamentos do Supabase:", error);
      return []; // Retornar array vazio em vez de dados mockados
    }
    
    return quotes as unknown as Quote[];
  } catch (error) {
    console.error("Erro inesperado ao buscar orçamentos:", error);
    return []; // Retornar array vazio em vez de dados mockados
  }
}

export { savedQuotes };
