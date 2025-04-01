
/**
 * Arquivo de provedores de dados conectados ao Supabase
 * Este arquivo encapsula as chamadas ao Supabase para fornecer dados à aplicação
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  getClientsFromSupabase, 
  getClientByDocument, 
  saveClientToSupabase,
  getAllVehicles,
  findVehicleByPlate,
  getVehicleGroupById as getVehicleGroupByIdFromSupabase,
  getVehicleGroups as getVehicleGroupsFromSupabase,
  getQuotesFromSupabase,
  getQuoteByIdFromSupabase
} from '@/integrations/supabase';

// Definição de tipos exportados
export type Client = {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string;
  email?: string;
};

export type VehicleGroup = {
  id: string;
  name: string;
  revisionKm: number;
  tireKm: number;
  revisionCost: number;
  tireCost: number;
  description?: string;
};

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  isUsed?: boolean;
  plateNumber?: string;
  color?: string;
  odometer?: number;
  fuelType?: string;
  revisionKm?: number;
  revisionCost?: number;
  tireKm?: number;
  tireCost?: number;
  groupId?: string;
}

export type Quote = {
  id: string;
  clientId: string;
  vehicleId: string;
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
  hasTracking: boolean;
  createdAt: string;
  totalCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  costPerKm: number;
};

// Valores de exemplo para quando o Supabase não retornar dados
// Estes serão usados apenas como fallback
const defaultClients: Client[] = [
  {
    id: '1',
    name: 'João da Silva',
    type: 'PF',
    document: '123.456.789-00',
    email: 'joao.silva@email.com',
  },
  {
    id: '2',
    name: 'Empresa ABC Ltda',
    type: 'PJ',
    document: '00.123.456/0001-90',
    email: 'contato@empresaabc.com.br',
  }
];

const defaultVehicleGroups: VehicleGroup[] = [
  {
    id: 'A',
    name: 'Grupo A',
    revisionKm: 10000,
    tireKm: 40000,
    revisionCost: 300,
    tireCost: 1200,
    description: 'Veículos de pequeno porte'
  },
  {
    id: 'B',
    name: 'Grupo B',
    revisionKm: 15000,
    tireKm: 45000,
    revisionCost: 350,
    tireCost: 1400,
    description: 'Veículos de médio porte'
  },
  {
    id: 'C',
    name: 'Grupo C',
    revisionKm: 20000,
    tireKm: 50000,
    revisionCost: 400,
    tireCost: 1600,
    description: 'Veículos de grande porte'
  }
];

const defaultVehicles: Vehicle[] = [
  {
    id: '1',
    brand: 'Fiat',
    model: 'Uno',
    year: 2022,
    value: 50000,
    groupId: 'A'
  },
  {
    id: '2',
    brand: 'Volkswagen',
    model: 'Gol',
    year: 2023,
    value: 55000,
    groupId: 'A'
  }
];

const defaultQuotes: Quote[] = [
  {
    id: '1',
    clientId: '1',
    vehicleId: '5',
    contractMonths: 24,
    monthlyKm: 2000,
    operationSeverity: 2,
    hasTracking: true,
    createdAt: '2023-10-10T10:00:00Z',
    totalCost: 1850,
    depreciationCost: 1200,
    maintenanceCost: 600,
    trackingCost: 50,
    costPerKm: 0.925
  }
];

// Array vazio para quotes salvos (mantido para compatibilidade)
export const savedQuotes: Quote[] = [];

// Funções para clientes
export const getClients = async (): Promise<Client[]> => {
  try {
    const { clients, success } = await getClientsFromSupabase();
    if (success && clients && clients.length > 0) {
      return clients.map(client => ({
        id: client.id,
        name: client.name,
        type: (client.type === 'PJ' ? 'PJ' : 'PF') as 'PJ' | 'PF', 
        document: client.document || '',
        email: client.email || undefined
      }));
    }
    console.warn('Nenhum cliente retornado do Supabase, usando dados padrão');
    return defaultClients;
  } catch (error) {
    console.error('Erro ao buscar clientes do Supabase, usando dados padrão', error);
    return defaultClients;
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
          type: (client.type === 'PJ' ? 'PJ' : 'PF') as 'PJ' | 'PF',
          document: client.document || '',
          email: client.email || undefined
        };
      }
    }
    console.warn(`Cliente com ID ${id} não encontrado no Supabase, procurando em dados padrão`);
    return defaultClients.find(c => c.id === id);
  } catch (error) {
    console.error('Erro ao buscar cliente por ID do Supabase, usando dados padrão', error);
    return defaultClients.find(c => c.id === id);
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
        type: (data.type === 'PJ' ? 'PJ' : 'PF') as 'PJ' | 'PF',
        document: data.document || '',
        email: data.email || undefined
      };
    }
    console.error('Falha ao salvar cliente no Supabase');
    return client; // Retorna o cliente original em caso de erro
  } catch (error) {
    console.error('Erro ao salvar cliente no Supabase', error);
    return client; // Retorna o cliente original em caso de erro
  }
};

// Funções para grupos de veículos
export const getVehicleGroups = async (): Promise<VehicleGroup[]> => {
  try {
    const { groups, success } = await getVehicleGroupsFromSupabase();
    if (success && groups && groups.length > 0) {
      return groups;
    }
    console.warn('Nenhum grupo de veículos retornado do Supabase, usando dados padrão');
    return defaultVehicleGroups;
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos do Supabase, usando dados padrão', error);
    return defaultVehicleGroups;
  }
};

export const getVehicleGroupById = async (id: string): Promise<VehicleGroup | null> => {
  try {
    const group = await getVehicleGroupByIdFromSupabase(id);
    if (group) {
      return group;
    }
    console.warn(`Grupo de veículo com ID ${id} não encontrado no Supabase, procurando em dados padrão`);
    return defaultVehicleGroups.find(group => group.id === id) || null;
  } catch (error) {
    console.error('Erro ao buscar grupo de veículo por ID do Supabase, usando dados padrão', error);
    return defaultVehicleGroups.find(group => group.id === id) || null;
  }
};

// Funções para veículos
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const { vehicles, success } = await getAllVehicles();
    if (success && vehicles && vehicles.length > 0) {
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
    console.warn('Nenhum veículo retornado do Supabase, usando dados padrão');
    return defaultVehicles;
  } catch (error) {
    console.error('Erro ao buscar veículos do Supabase, usando dados padrão', error);
    return defaultVehicles;
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
    console.warn(`Veículo com ID ${id} não encontrado no Supabase, procurando em dados padrão`);
    return defaultVehicles.find(v => v.id === id);
  } catch (error) {
    console.error('Erro ao buscar veículo por ID do Supabase, usando dados padrão', error);
    return defaultVehicles.find(v => v.id === id);
  }
};

// Funções para quotes (orçamentos)
export const getQuotes = async (): Promise<Quote[]> => {
  try {
    const { quotes, success } = await getQuotesFromSupabase();
    if (success && quotes && quotes.length > 0) {
      return quotes.map(q => ({
        id: q.id,
        clientId: q.client_id || '',
        vehicleId: q.vehicle_id || '',
        contractMonths: q.contract_months || 12,
        monthlyKm: q.monthly_km || 2000,
        operationSeverity: (q.operation_severity || 3) as 1 | 2 | 3 | 4 | 5 | 6,
        hasTracking: q.has_tracking || false,
        createdAt: q.created_at || new Date().toISOString(),
        totalCost: q.total_value || 0,
        depreciationCost: 0, // Campos adicionais a serem calculados 
        maintenanceCost: 0,
        trackingCost: 0,
        costPerKm: 0
      }));
    }
    console.warn('Nenhum orçamento retornado do Supabase, usando dados padrão');
    return defaultQuotes;
  } catch (error) {
    console.error('Erro ao buscar orçamentos do Supabase, usando dados padrão', error);
    return defaultQuotes;
  }
};

export const getQuoteById = async (id: string): Promise<Quote | undefined> => {
  try {
    const { quote, success } = await getQuoteByIdFromSupabase(id);
    if (success && quote) {
      return {
        id: quote.id,
        clientId: quote.client_id || '',
        vehicleId: quote.vehicle_id || '',
        contractMonths: quote.contract_months || 12,
        monthlyKm: quote.monthly_km || 2000,
        operationSeverity: (quote.operation_severity || 3) as 1 | 2 | 3 | 4 | 5 | 6,
        hasTracking: quote.has_tracking || false,
        createdAt: quote.created_at || new Date().toISOString(),
        totalCost: quote.total_value || 0,
        depreciationCost: 0, // Campos adicionais a serem calculados
        maintenanceCost: 0,
        trackingCost: 0,
        costPerKm: 0
      };
    }
    console.warn(`Orçamento com ID ${id} não encontrado no Supabase, procurando em dados padrão`);
    return defaultQuotes.find(q => q.id === id);
  } catch (error) {
    console.error('Erro ao buscar orçamento por ID do Supabase, usando dados padrão', error);
    return defaultQuotes.find(q => q.id === id);
  }
};

// Funções para manutenção de veículos
export const getVehicleMaintenance = (vehicle: Vehicle) => {
  const group = defaultVehicleGroups.find(g => g.id === vehicle.groupId);
  return {
    revisionKm: vehicle.revisionKm || group?.revisionKm || 10000,
    revisionCost: vehicle.revisionCost || group?.revisionCost || 500,
    tireKm: vehicle.tireKm || group?.tireKm || 40000,
    tireCost: vehicle.tireCost || group?.tireCost || 2000
  };
};

// Re-exportar valores para manter retrocompatibilidade
export const quotes = defaultQuotes;
