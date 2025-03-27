// Mock data for clients
export interface Client {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  email: string;
}

export interface CustomClient {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  email: string;
}

export const clients: Client[] = [
  { id: '1', name: 'João da Silva', document: '123.456.789-00', type: 'PF', email: 'joao@email.com' },
  { id: '2', name: 'Maria Souza', document: '987.654.321-00', type: 'PF', email: 'maria@email.com' },
  { id: '3', name: 'Empresa ABC Ltda', document: '12.345.678/0001-90', type: 'PJ', email: 'abc@email.com' },
];

// Mock data for vehicles
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plateNumber?: string;
  value: number;
  groupId: string;
}

export const vehicles: Vehicle[] = [
  { id: '1', brand: 'Fiat', model: 'Uno', value: 45000, groupId: '1' },
  { id: '2', brand: 'Volkswagen', model: 'Gol', value: 50000, groupId: '1' },
  { id: '3', brand: 'Toyota', model: 'Corolla', value: 90000, groupId: '2' },
  { id: '4', brand: 'Honda', model: 'Civic', value: 85000, groupId: '2' },
  { id: '5', brand: 'Mercedes-Benz', model: 'C180', value: 150000, groupId: '3' },
  { id: '6', brand: 'BMW', model: '320i', value: 160000, groupId: '3' },
];

// Mock data for vehicle groups
export interface VehicleGroup {
  id: string;
  name: string;
  depreciationRate: number;
  maintenanceCost: number;
}

export const vehicleGroups: VehicleGroup[] = [
  { id: '1', name: 'Grupo A', depreciationRate: 0.01, maintenanceCost: 300 },
  { id: '2', name: 'Grupo B', depreciationRate: 0.015, maintenanceCost: 450 },
  { id: '3', name: 'Grupo C', depreciationRate: 0.02, maintenanceCost: 600 },
];

// Mock data for quotes
export interface Quote {
  id: string;
  client: Client;
  vehicle: Vehicle;
  contractMonths: number;
  monthlyKm: number;
  totalCost: number;
  createdAt: string;
}

export const quotes: Quote[] = [
  { id: '1', client: clients[0], vehicle: vehicles[0], contractMonths: 24, monthlyKm: 3000, totalCost: 1500, createdAt: '2023-01-01' },
  { id: '2', client: clients[1], vehicle: vehicles[1], contractMonths: 36, monthlyKm: 2500, totalCost: 1800, createdAt: '2023-02-15' },
  { id: '3', client: clients[2], vehicle: vehicles[2], contractMonths: 48, monthlyKm: 2000, totalCost: 2500, createdAt: '2023-03-20' },
];

// Function to simulate API calls
export const getClients = (): Client[] => {
  return clients;
};

export const getClientById = (id: string): Client | undefined => {
  return clients.find(client => client.id === id);
};

export const getVehicles = (): Vehicle[] => {
  return vehicles;
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehicles.find(vehicle => vehicle.id === id);
};

export const getVehicleGroups = (): VehicleGroup[] => {
  return vehicleGroups;
};

export const getVehicleGroupById = (id: string): VehicleGroup | undefined => {
  return vehicleGroups.find(group => group.id === id);
};

// Function to fetch quotes (using mock data for now)
export const getQuotes = (): Promise<{ success: boolean; quotes: Quote[]; error?: any }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, quotes });
    }, 500);
  });
};

// Função para buscar orçamentos
export async function getQuotes() {
  try {
    // Importar e usar a função do cliente Supabase
    const { getQuotesFromSupabase } = await import('@/integrations/supabase/client');
    return await getQuotesFromSupabase();
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return { success: false, error, quotes: [] };
  }
}
