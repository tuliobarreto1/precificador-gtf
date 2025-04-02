
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

export function getClientById(id: string): Client {
  if (!id) return {} as Client;
  
  // Buscar nos dados simulados para evitar chamadas assíncronas
  const mockClient = mockClients.find(c => c.id === id);
  if (mockClient) {
    return mockClient;
  }
  
  // Retornar um cliente vazio se não encontrado
  return {
    id: '',
    name: 'Cliente não encontrado',
    type: 'PJ',
    document: ''
  } as Client;
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

export function getVehicleById(id: string): Vehicle {
  if (!id) return {} as Vehicle;
  
  // Buscar nos dados simulados para evitar chamadas assíncronas
  const mockVehicle = mockVehicles.find(v => v.id === id);
  if (mockVehicle) {
    return mockVehicle;
  }
  
  // Retornar um veículo vazio se não encontrado
  return {
    id: '',
    brand: 'Veículo não encontrado',
    model: '',
    year: new Date().getFullYear(),
    value: 0,
    isUsed: false,
    groupId: 'A'
  } as Vehicle;
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

export function getVehicleGroupById(id: string): VehicleGroup {
  if (!id) return {} as VehicleGroup;
  
  // Buscar nos dados simulados para evitar chamadas assíncronas
  const mockGroup = mockVehicleGroups.find(g => g.id === id);
  if (mockGroup) {
    return mockGroup;
  }
  
  // Retornar um grupo vazio se não encontrado
  return {
    id: '',
    name: 'Grupo não encontrado',
    description: '',
    revisionKm: 10000,
    revisionCost: 500,
    tireKm: 40000,
    tireCost: 2000
  } as VehicleGroup;
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
