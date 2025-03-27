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
export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  groupId: string;
  isUsed: boolean;
  plateNumber?: string;   // Add plate number for used vehicles
  color?: string;         // Add color for used vehicles
  odometer?: number;      // Add odometer for used vehicles
};

// Quote type - expanded to include all needed properties
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
  // Propriedades adicionais para compatibilidade
  date?: string;
  clientName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleGroup: string;
  value: number;
  months: number;
  extraKmRate: number;
};

export const clients: Client[] = [
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

// Sample quotes data com campos expandidos para compatibilidade
export const quotes: Quote[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'João da Silva',
    vehicleId: '5',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleGroup: 'C',
    contractMonths: 24,
    months: 24,
    monthlyKm: 2000,
    operationSeverity: 2,
    hasTracking: true,
    createdAt: '2023-10-10T10:00:00Z',
    date: '2023-10-10T10:00:00Z',
    totalCost: 1850,
    value: 1850,
    depreciationCost: 1200,
    maintenanceCost: 600,
    trackingCost: 50,
    costPerKm: 0.925,
    extraKmRate: 0.5
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Empresa ABC Ltda',
    vehicleId: '3',
    vehicleBrand: 'Hyundai',
    vehicleModel: 'HB20',
    vehicleGroup: 'B',
    contractMonths: 36,
    months: 36,
    monthlyKm: 1500,
    operationSeverity: 1,
    hasTracking: true,
    createdAt: '2023-10-12T14:30:00Z',
    date: '2023-10-12T14:30:00Z',
    totalCost: 1450,
    value: 1450,
    depreciationCost: 900,
    maintenanceCost: 500, 
    trackingCost: 50,
    costPerKm: 0.967,
    extraKmRate: 0.45
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Maria Souza',
    vehicleId: '1',
    vehicleBrand: 'Fiat',
    vehicleModel: 'Uno',
    vehicleGroup: 'A',
    contractMonths: 12,
    months: 12,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: false,
    createdAt: '2023-10-15T09:15:00Z',
    date: '2023-10-15T09:15:00Z',
    totalCost: 1200,
    value: 1200,
    depreciationCost: 850,
    maintenanceCost: 350,
    trackingCost: 0,
    costPerKm: 0.4,
    extraKmRate: 0.4
  },
  {
    id: '4',
    clientId: '1',
    clientName: 'João da Silva',
    vehicleId: '6',
    vehicleBrand: 'Honda',
    vehicleModel: 'Civic',
    vehicleGroup: 'C',
    contractMonths: 48,
    months: 48,
    monthlyKm: 2500,
    operationSeverity: 2,
    hasTracking: true,
    createdAt: '2023-10-18T16:45:00Z',
    date: '2023-10-18T16:45:00Z',
    totalCost: 1750,
    value: 1750,
    depreciationCost: 1100,
    maintenanceCost: 600,
    trackingCost: 50,
    costPerKm: 0.7,
    extraKmRate: 0.48
  },
  {
    id: '5',
    clientId: '2',
    clientName: 'Empresa ABC Ltda',
    vehicleId: '2',
    vehicleBrand: 'Volkswagen',
    vehicleModel: 'Gol',
    vehicleGroup: 'A',
    contractMonths: 24,
    months: 24,
    monthlyKm: 1000,
    operationSeverity: 1,
    hasTracking: false,
    createdAt: '2023-10-20T11:30:00Z',
    date: '2023-10-20T11:30:00Z',
    totalCost: 1150,
    value: 1150,
    depreciationCost: 850,
    maintenanceCost: 300,
    trackingCost: 0,
    costPerKm: 1.15,
    extraKmRate: 0.43
  },
  {
    id: '6',
    clientId: '3',
    clientName: 'Maria Souza',
    vehicleId: '4',
    vehicleBrand: 'Chevrolet',
    vehicleModel: 'Onix',
    vehicleGroup: 'B',
    contractMonths: 36,
    months: 36,
    monthlyKm: 2000,
    operationSeverity: 2,
    hasTracking: true,
    createdAt: '2023-10-22T13:20:00Z',
    date: '2023-10-22T13:20:00Z',
    totalCost: 1600,
    value: 1600,
    depreciationCost: 1000,
    maintenanceCost: 550,
    trackingCost: 50,
    costPerKm: 0.8,
    extraKmRate: 0.46
  }
];

export const getVehicleGroupById = (id: string) => {
  return vehicleGroups.find(group => group.id === id);
};

// Helper functions to access related data - added to fix the import errors
export const getClientById = (id: string) => {
  return clients.find(client => client.id === id);
};

export const getVehicleById = (id: string) => {
  return vehicles.find(vehicle => vehicle.id === id);
};

// Função para obter cotação por ID
export const getQuoteById = (id: string) => {
  return quotes.find(quote => quote.id === id);
};

// Para compatibilidade com o Quotes.tsx
export const mockQuotes = quotes;
