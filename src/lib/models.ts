
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
  ipvaCost?: number; // Novo campo para custo do IPVA
  licensingCost?: number; // Novo campo para custo do Licenciamento
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
  includeIpva?: boolean; // Novo campo para IPVA
  includeLicensing?: boolean; // Novo campo para Licenciamento
  client?: Client;
  vehicles?: {
    vehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    totalCost: number;
  }[];
  clientName?: string;
}

// Array vazio para armazenar orçamentos salvos localmente, se necessário
export const savedQuotes: Quote[] = [];
