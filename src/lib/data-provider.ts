
import { supabase } from '@/integrations/supabase';
import { Client, Vehicle, VehicleGroup, Quote, mockClients, mockVehicleGroups, mockVehicles, mockQuotes, savedQuotes } from './models';

// Funções para clientes
export async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
      
    if (error || !data) {
      console.error("Erro ao buscar clientes do Supabase:", error);
      return mockClients; // Fallback para dados mock
    }
    
    // Mapear os dados do Supabase para o formato Client
    return data.map(client => ({
      id: client.id,
      name: client.name,
      type: (client.type === 'PF' || client.type === 'PJ') ? client.type : 'PJ',
      document: client.document || '',
      email: client.email,
      contact: client.phone,
      responsible: client.responsible_person
    }));
  } catch (error) {
    console.error("Erro inesperado ao buscar clientes:", error);
    return mockClients; // Fallback para dados mock
  }
}

export async function getClientById(id: string): Promise<Client> {
  if (!id) return {} as Client;
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error || !data) {
      console.error(`Erro ao buscar cliente ${id}:`, error);
      // Fallback para dados mock
      const mockClient = mockClients.find(c => c.id === id);
      return mockClient || {} as Client;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: (data.type === 'PF' || data.type === 'PJ') ? data.type : 'PJ',
      document: data.document || '',
      email: data.email,
      contact: data.phone,
      responsible: data.responsible_person
    };
  } catch (error) {
    console.error(`Erro inesperado ao buscar cliente ${id}:`, error);
    // Fallback para dados mock
    const mockClient = mockClients.find(c => c.id === id);
    return mockClient || {} as Client;
  }
}

export function addClient(client: Client): Client {
  // No mundo real, adicionaria ao Supabase aqui
  // Por enquanto, apenas retornamos o cliente
  return client;
}

export function getClientByDocument(document: string): Client | null {
  // Simulação para o formulário de cliente
  const existingClient = mockClients.find(c => c.document === document);
  return existingClient || null;
}

// Funções para veículos
export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
      
    if (error || !data) {
      console.error("Erro ao buscar veículos do Supabase:", error);
      return mockVehicles; // Fallback para dados mock
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
    return mockVehicles; // Fallback para dados mock
  }
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  if (!id) return {} as Vehicle;
  
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error || !data) {
      console.error(`Erro ao buscar veículo ${id}:`, error);
      // Fallback para dados mock
      const mockVehicle = mockVehicles.find(v => v.id === id);
      return mockVehicle || {} as Vehicle;
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
    console.error(`Erro inesperado ao buscar veículo ${id}:`, error);
    // Fallback para dados mock
    const mockVehicle = mockVehicles.find(v => v.id === id);
    return mockVehicle || {} as Vehicle;
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
      return mockVehicleGroups; // Fallback para dados mock
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
    return mockVehicleGroups; // Fallback para dados mock
  }
}

export async function getVehicleGroupById(id: string): Promise<VehicleGroup> {
  if (!id) return {} as VehicleGroup;
  
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .eq('code', id)
      .maybeSingle();
      
    if (error || !data) {
      console.error(`Erro ao buscar grupo de veículo ${id}:`, error);
      // Fallback para dados mock
      const mockGroup = mockVehicleGroups.find(g => g.id === id);
      return mockGroup || {} as VehicleGroup;
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
    console.error(`Erro inesperado ao buscar grupo de veículo ${id}:`, error);
    // Fallback para dados mock
    const mockGroup = mockVehicleGroups.find(g => g.id === id);
    return mockGroup || {} as VehicleGroup;
  }
}

// Funções para orçamentos
export async function getQuotes(): Promise<Quote[]> {
  try {
    const { quotes, success, error } = await import('@/integrations/supabase').then(m => m.getQuotesFromSupabase());
    
    if (!success || !quotes || quotes.length === 0) {
      console.error("Erro ao buscar orçamentos do Supabase:", error);
      return mockQuotes; // Fallback para dados mock
    }
    
    return quotes as unknown as Quote[];
  } catch (error) {
    console.error("Erro inesperado ao buscar orçamentos:", error);
    return mockQuotes; // Fallback para dados mock
  }
}

export { mockClients, mockVehicleGroups, mockVehicles, mockQuotes, savedQuotes };
