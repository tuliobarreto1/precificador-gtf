
// Removendo a referência ao '@prisma/client' que está causando erros
// import { Vehicle, VehicleGroup, Client as PrismaClient } from '@prisma/client';

export interface Client {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

// Adicionando QuoteParams para substituir VehicleParams onde necessário
export interface QuoteParams {
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1|2|3|4|5|6;
  hasTracking: boolean;
  protectionPlanId: string | null;
  includeIpva: boolean;
  includeLicensing: boolean;
  includeTaxes: boolean;
}

// Mantendo VehicleParams para compatibilidade com código existente
export interface VehicleParams {
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1|2|3|4|5|6;
  hasTracking: boolean;
  protectionPlanId: string | null;
  includeIpva: boolean;
  includeLicensing: boolean;
  includeTaxes: boolean;
}

export interface QuoteFormData {
  client: Client | null;
  vehicles: {
    vehicle: Vehicle;
    vehicleGroup: VehicleGroup;
    params: VehicleParams | null;
  }[];
  useGlobalParams: boolean;
  globalParams: VehicleParams;
}

export interface QuoteCalculationResult {
  vehicleResults: QuoteResultVehicle[];
  totalCost: number;
}

export interface QuoteResultVehicle {
  vehicleId: string;
  totalCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  extraKmRate: number;
  protectionCost: number;
  protectionPlanId: string | null;
  ipvaCost: number;
  licensingCost: number;
  taxCost: number;
  includeIpva: boolean;
  includeLicensing: boolean;
  includeTaxes: boolean;
  contractMonths: number;
  monthlyKm?: number;
}

export interface SavedQuote {
  id: string;
  clientName: string;
  totalValue: number;
  contractMonths?: number;
  monthlyKm?: number;
  operationSeverity?: number;
  hasTracking?: boolean;
  includeIpva?: boolean;
  includeLicensing?: boolean;
  includeTaxes?: boolean; // Adicionando campo para impostos
  status: string;
  vehicles: SavedVehicle[];
  createdAt: Date;
  createdBy?: User;
  globalParams?: VehicleParams;
  // Adicionando campos necessários para compatibilidade com o código existente
  source?: string;
  clientId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string; // Adicionando role para resolver os erros em useQuoteUsers.ts
  status?: string; // Adicionando status para resolver os erros em useQuoteUsers.ts
}

// Adicionando UserRole para resolver os erros em useQuoteUsers.ts
export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export const defaultUser: User = {
  id: 'system',
  name: 'System User',
  email: 'system@example.com',
};

export interface QuoteContextType {
  quoteForm: QuoteFormData;
  setClient: (client: Client | null) => void;
  addVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  removeVehicle: (vehicleId: string) => void;
  setGlobalContractMonths: (months: number) => void;
  setGlobalMonthlyKm: (km: number) => void;
  setGlobalOperationSeverity: (severity: 1|2|3|4|5|6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setGlobalProtectionPlanId: (planId: string | null) => void;
  setGlobalIncludeIpva: (include: boolean) => void;
  setGlobalIncludeLicensing: (include: boolean) => void;
  setGlobalIncludeTaxes: (include: boolean) => void;
  setUseGlobalParams: (useGlobal: boolean) => void;
  setVehicleParams: (vehicleId: string, params: Partial<VehicleParams>) => void;
  resetForm: () => void;
  calculateQuote: () => QuoteCalculationResult | null;
  saveQuote: () => Promise<boolean>;
  getCurrentUser: () => User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  isEditMode: boolean;
  currentEditingQuoteId: string | null;
  getClientById: (clientId: string) => Promise<Client | null>;
  getVehicleById: (vehicleId: string) => Promise<Vehicle | null>;
  loadQuoteForEditing: (quoteId: string) => Promise<boolean>;
  deleteQuote: (quoteId: string) => Promise<boolean>;
  canEditQuote: (quote: SavedQuote, user: User) => boolean;
  canDeleteQuote: (quote: SavedQuote, user: User) => boolean;
  sendQuoteByEmail: (quoteId: string, email: string, message?: string) => Promise<boolean>;
  savedQuotes: SavedQuote[];
}

export interface SavedVehicle {
  id: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  plateNumber?: string;
  totalCost: number;
  monthlyKm?: number;
  contractMonths?: number;
  depreciationCost?: number;
  maintenanceCost?: number;
  extraKmRate?: number;
  protectionCost?: number;
  protectionPlanId?: string | null;
  ipvaCost?: number;
  licensingCost?: number;
  includeIpva?: boolean;
  includeLicensing?: boolean;
  includeTaxes?: boolean;
  taxCost?: number;
  vehicleValue?: number;
  vehicleGroupId?: string; // Adicionando para resolver problemas em useQuoteData.ts
}

// Adicionando QuoteItem para resolver o erro em QuoteTable.tsx
export interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName?: string;
  value?: number;
  status: string;
  createdAt: string | Date;
  createdBy?: User;
}

// Adicionando QuoteVehicleItem para resolver erros em hooks
export interface QuoteVehicleItem {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  params: VehicleParams | null;
}

// Adicionando tipo Vehicle para uso nos componentes
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  plateNumber?: string;
  status?: string;
}

// Adicionando tipo VehicleGroup para uso nos componentes
export interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  revisionKm?: number;
  revisionCost?: number;
  tireKm?: number;
  tireCost?: number;
  ipvaCost?: number;
  licensingCost?: number;
}

// Adicionando EditRecord para resolver erro em useQuoteSaving.ts
export interface EditRecord {
  id: string;
  type: string;
  data: any;
}
