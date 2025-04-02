
// Tipos e interfaces básicas para o sistema
export type ClientType = 'PF' | 'PJ';

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  document: string;
  email?: string;
  contact?: string;
  responsible?: string;
}

export interface VehicleGroup {
  id: string;
  name: string;
  description: string;
  revisionKm: number;
  revisionCost: number;
  tireKm: number;
  tireCost: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  isUsed: boolean;
  plateNumber?: string;
  color?: string;
  odometer?: number;
  fuelType?: string;
  groupId: string;
}

export interface Quote {
  id: string;
  clientId: string;
  vehicleId: string;
  contractMonths: number;
  monthlyKm: number;
  totalCost: number;
  createdAt: string;
  status?: string;
  operationSeverity?: number;
  hasTracking?: boolean;
  client?: Client;
  vehicles?: {
    vehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    totalCost: number;
  }[];
  clientName?: string;
}

// Adicionamos a exportação explícita dos dados simulados (mocks)
export const mockClients: Client[] = [
  { 
    id: '1', 
    name: 'Empresa ABC Ltda', 
    type: 'PJ', 
    document: '12.345.678/0001-90',
    email: 'contato@empresaabc.com.br'
  },
  { 
    id: '2', 
    name: 'João Silva', 
    type: 'PF', 
    document: '123.456.789-00',
    email: 'joao.silva@email.com'
  },
  { 
    id: '3', 
    name: 'Distribuidora XYZ S.A.', 
    type: 'PJ', 
    document: '98.765.432/0001-10',
    email: 'financeiro@xyzsa.com.br'
  }
];

export const mockVehicleGroups: VehicleGroup[] = [
  {
    id: 'A',
    name: 'Grupo A - Compactos',
    description: 'Veículos de pequeno porte',
    revisionKm: 10000,
    revisionCost: 400,
    tireKm: 40000,
    tireCost: 1600
  },
  {
    id: 'B',
    name: 'Grupo B - Sedan',
    description: 'Veículos sedan médios',
    revisionKm: 10000,
    revisionCost: 500,
    tireKm: 40000,
    tireCost: 2000
  },
  {
    id: 'C',
    name: 'Grupo C - SUV',
    description: 'Veículos utilitários esportivos',
    revisionKm: 10000,
    revisionCost: 700,
    tireKm: 40000,
    tireCost: 3000
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    brand: 'Fiat',
    model: 'Uno',
    year: 2022,
    value: 60000,
    isUsed: false,
    groupId: 'A'
  },
  {
    id: '2',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    value: 120000,
    isUsed: false,
    groupId: 'B'
  },
  {
    id: '3',
    brand: 'Jeep',
    model: 'Compass',
    year: 2022,
    value: 150000,
    isUsed: false,
    groupId: 'C'
  }
];

export const mockQuotes: Quote[] = [
  {
    id: '1',
    clientId: '1',
    vehicleId: '1',
    contractMonths: 24,
    monthlyKm: 3000,
    totalCost: 2500,
    createdAt: new Date().toISOString(),
    status: 'ORCAMENTO',
    operationSeverity: 3,
    hasTracking: false,
    clientName: 'Empresa ABC Ltda',
    vehicles: [
      {
        vehicleId: '1',
        vehicleBrand: 'Fiat',
        vehicleModel: 'Uno',
        totalCost: 2500
      }
    ]
  }
];

export const savedQuotes: Quote[] = [];
