
/**
 * Arquivo de transição para substituir o mock-data.ts
 * Este arquivo encapsula as chamadas originais do mock-data e redireciona para o Supabase
 */

import * as mockData from './mock-data';
import { 
  getClientsFromSupabase, 
  getClientByDocument, 
  saveClientToSupabase,
  getAllVehicles,
  findVehicleByPlate,
  getVehicleGroupById,
  getVehicleGroups,
  getQuotesFromSupabase
} from '@/integrations/supabase';
import { v4 as uuidv4 } from 'uuid';

// Retrocompatibilidade com tipos exportados do mock-data
export type Client = mockData.Client;
export type VehicleGroup = mockData.VehicleGroup;
export type Vehicle = mockData.Vehicle;
export type Quote = mockData.Quote;

// Funções para clientes
export const getClients = async (): Promise<Client[]> => {
  try {
    const { clients, success } = await getClientsFromSupabase();
    if (success && clients) {
      return clients.map(client => ({
        id: client.id,
        name: client.name,
        type: client.type === 'PJ' ? 'PJ' : 'PF',
        document: client.document || '',
        email: client.email || undefined
      }));
    }
    return mockData.getClients();
  } catch (error) {
    console.error('Erro ao buscar clientes do Supabase, usando dados mockados', error);
    return mockData.getClients();
  }
};

export const getClientById = async (id: string): Promise<Client | undefined> => {
  try {
    const { clients, success } = await getClientsFromSupabase();
    if (success && clients) {
      const client = clients.find(c => c.id === id);
      if (client) {
        return {
          id: client.id,
          name: client.name,
          type: client.type === 'PJ' ? 'PJ' : 'PF',
          document: client.document || '',
          email: client.email || undefined
        };
      }
    }
    return mockData.getClientById(id);
  } catch (error) {
    console.error('Erro ao buscar cliente por ID do Supabase, usando dados mockados', error);
    return mockData.getClientById(id);
  }
};

export const addClient = async (client: Client): Promise<Client> => {
  try {
    const { success, data } = await saveClientToSupabase({
      ...client,
      id: client.id || uuidv4()
    });
    
    if (success && data) {
      return {
        id: data.id,
        name: data.name,
        type: data.type === 'PJ' ? 'PJ' : 'PF',
        document: data.document || '',
        email: data.email || undefined
      };
    }
    return mockData.addClient(client);
  } catch (error) {
    console.error('Erro ao salvar cliente no Supabase, usando dados mockados', error);
    return mockData.addClient(client);
  }
};

// Funções para grupos de veículos
export const getVehicleGroups = async (): Promise<VehicleGroup[]> => {
  try {
    const { groups, success } = await getVehicleGroups();
    if (success && groups) {
      return groups;
    }
    return mockData.vehicleGroups;
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos do Supabase, usando dados mockados', error);
    return mockData.vehicleGroups;
  }
};

export const getVehicleGroupById = async (id: string): Promise<VehicleGroup | null> => {
  try {
    const group = await getVehicleGroupById(id);
    if (group) {
      return group;
    }
    return mockData.getVehicleGroupById(id) || null;
  } catch (error) {
    console.error('Erro ao buscar grupo de veículo por ID do Supabase, usando dados mockados', error);
    return mockData.getVehicleGroupById(id) || null;
  }
};

// Funções para veículos
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const { vehicles, success } = await getAllVehicles();
    if (success && vehicles) {
      return vehicles.map(v => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        value: v.value,
        isUsed: v.is_used,
        plateNumber: v.plate_number,
        color: v.color,
        odometer: v.odometer,
        fuelType: v.fuel_type,
        groupId: v.group_id
      }));
    }
    return mockData.vehicles;
  } catch (error) {
    console.error('Erro ao buscar veículos do Supabase, usando dados mockados', error);
    return mockData.vehicles;
  }
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  try {
    const { vehicles, success } = await getAllVehicles();
    if (success && vehicles) {
      const vehicle = vehicles.find(v => v.id === id);
      if (vehicle) {
        return {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          value: vehicle.value,
          isUsed: vehicle.is_used,
          plateNumber: vehicle.plate_number,
          color: vehicle.color,
          odometer: vehicle.odometer,
          fuelType: vehicle.fuel_type,
          groupId: vehicle.group_id
        };
      }
    }
    return mockData.getVehicleById(id);
  } catch (error) {
    console.error('Erro ao buscar veículo por ID do Supabase, usando dados mockados', error);
    return mockData.getVehicleById(id);
  }
};

// Funções para manutenção de veículos
export const getVehicleMaintenance = (vehicle: Vehicle) => {
  return mockData.getVehicleMaintenance(vehicle);
};

// Re-exportar valores mockados para manter retrocompatibilidade
export const { quotes, savedQuotes } = mockData;
