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
  revisionCost: number; // Added to fix Parameter.tsx errors
  tireCost: number; // Added to fix Parameter.tsx errors
  description?: string; // Added to fix Parameter.tsx errors
};

// Vehicle type
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  isUsed?: boolean;
  plateNumber?: string;   // Add plate number for used vehicles
  color?: string;         // Add color for used vehicles
  odometer?: number;      // Add odometer for used vehicles
  revisionKm?: number;
  revisionCost?: number;
  tireKm?: number;
  tireCost?: number;
}

// Quote type - added to fix the import errors
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

// Carregar clientes do localStorage ou usar dados iniciais
const STORED_CLIENTS_KEY = 'lovClients';
const initialClients = [
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
  },
  {
    id: '3',
    name: 'Maria Souza',
    type: 'PF',
    document: '987.654.321-11',
  },
];

export const vehicleGroups: VehicleGroup[] = [
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
  },
];

export const vehicles: Vehicle[] = [
  {
    id: '1',
    brand: 'Fiat',
    model: 'Uno',
    year: 2022,
    value: 50000,
    groupId: 'A',
    isUsed: false,
  },
  {
    id: '2',
    brand: 'Volkswagen',
    model: 'Gol',
    year: 2023,
    value: 55000,
    groupId: 'A',
    isUsed: false,
  },
  {
    id: '3',
    brand: 'Hyundai',
    model: 'HB20',
    year: 2021,
    value: 60000,
    groupId: 'B',
    isUsed: false,
  },
  {
    id: '4',
    brand: 'Chevrolet',
    model: 'Onix',
    year: 2022,
    value: 65000,
    groupId: 'B',
    isUsed: false,
  },
  {
    id: '5',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    value: 120000,
    groupId: 'C',
    isUsed: false,
  },
  {
    id: '6',
    brand: 'Honda',
    model: 'Civic',
    year: 2022,
    value: 110000,
    groupId: 'C',
    isUsed: false,
  },
];

// Sample quotes data - added to fix the import errors
export const quotes: Quote[] = [
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
  },
  {
    id: '2',
    clientId: '2',
    vehicleId: '3',
    contractMonths: 36,
    monthlyKm: 1500,
    operationSeverity: 1,
    hasTracking: true,
    createdAt: '2023-10-12T14:30:00Z',
    totalCost: 1450,
    depreciationCost: 900,
    maintenanceCost: 500, 
    trackingCost: 50,
    costPerKm: 0.967
  },
  {
    id: '3',
    clientId: '3',
    vehicleId: '1',
    contractMonths: 12,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: false,
    createdAt: '2023-10-15T09:15:00Z',
    totalCost: 1200,
    depreciationCost: 850,
    maintenanceCost: 350,
    trackingCost: 0,
    costPerKm: 0.4
  },
  {
    id: '4',
    clientId: '1',
    vehicleId: '6',
    contractMonths: 48,
    monthlyKm: 2500,
    operationSeverity: 2,
    hasTracking: true,
    createdAt: '2023-10-18T16:45:00Z',
    totalCost: 1750,
    depreciationCost: 1100,
    maintenanceCost: 600,
    trackingCost: 50,
    costPerKm: 0.7
  },
  {
    id: '5',
    clientId: '2',
    vehicleId: '2',
    contractMonths: 24,
    monthlyKm: 1000,
    operationSeverity: 1,
    hasTracking: false,
    createdAt: '2023-10-20T11:30:00Z',
    totalCost: 1150,
    depreciationCost: 850,
    maintenanceCost: 300,
    trackingCost: 0,
    costPerKm: 1.15
  },
  {
    id: '6',
    clientId: '3',
    vehicleId: '4',
    contractMonths: 36,
    monthlyKm: 2000,
    operationSeverity: 2,
    hasTracking: true,
    createdAt: '2023-10-22T13:20:00Z',
    totalCost: 1600,
    depreciationCost: 1000,
    maintenanceCost: 550,
    trackingCost: 50,
    costPerKm: 0.8
  }
];

export const getVehicleGroupById = (id: string) => {
  return vehicleGroups.find(group => group.id === id);
};

// Helper functions to access related data - added to fix the import errors
// Carregar clientes
let clientsData = JSON.parse(localStorage.getItem(STORED_CLIENTS_KEY) || 'null') || initialClients;

// Função para obter lista atualizada de clientes
export const getClients = () => clientsData;

// Função para salvar clientes no localStorage
const saveClientsToStorage = () => {
  localStorage.setItem(STORED_CLIENTS_KEY, JSON.stringify(clientsData));
};

// Funções helper para manipulação de clientes
export const getClientById = (id: string) => {
  return clientsData.find(client => client.id === id);
};

export const addClient = (client: Client) => {
  clientsData = [client, ...clientsData];
  saveClientsToStorage();
  return client;
};

// Função helper para buscar cliente por documento
export const getClientByDocument = (document: string) => {
  return clientsData.find(client => client.document === document);
};

export const getVehicleById = (id: string) => {
  return vehicles.find(vehicle => vehicle.id === id);
};

// Fornecer valores padrão para dados de manutenção
export const getVehicleMaintenance = (vehicle: Vehicle) => {
  return {
    revisionKm: vehicle.revisionKm || 10000,
    revisionCost: vehicle.revisionCost || 500,
    tireKm: vehicle.tireKm || 40000,
    tireCost: vehicle.tireCost || 2000
  };
};
