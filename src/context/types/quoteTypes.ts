import { Client, Vehicle, VehicleGroup } from '@/lib/models';

export interface QuoteParams {
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1|2|3|4|5|6;
  hasTracking: boolean;
  protectionPlanId?: string | null;
  includeIpva?: boolean;
  includeLicensing?: boolean;
}

export interface QuoteVehicleItem {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  params?: QuoteParams;
}

export interface QuoteFormData {
  client: Client | null;
  vehicles: QuoteVehicleItem[];
  useGlobalParams: boolean;
  globalParams: QuoteParams;
}

export interface QuoteResultVehicle {
  vehicleId: string;
  totalCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  extraKmRate: number;
  protectionCost?: number;
  protectionPlanId?: string | null;
  ipvaCost?: number;
  licensingCost?: number;
  includeIpva?: boolean;
  includeLicensing?: boolean;
  contractMonths?: number;
}

export interface QuoteCalculationResult {
  vehicleResults: QuoteResultVehicle[];
  totalCost: number;
}

export interface SavedVehicle {
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  totalCost: number;
  contractMonths?: number;
  monthlyKm?: number;
  plateNumber?: string;
  groupId?: string;
  protectionPlanId?: string | null;
  protectionCost?: number;
  includeIpva?: boolean;
  includeLicensing?: boolean;
  ipvaCost?: number;
  licensingCost?: number;
}

export interface SavedQuote {
  id: string;
  clientId: string;
  clientName: string;
  vehicles: SavedVehicle[];
  totalValue: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  totalCost?: number;
  source?: string;
  createdBy?: {
    id: number;
    name: string;
    role: string;
    email?: string;
    status?: 'active' | 'inactive';
    lastLogin?: string;
  };
  globalParams?: {
    contractMonths: number;
    monthlyKm: number;
    operationSeverity: number;
    hasTracking: boolean;
    protectionPlanId?: string | null;
    includeIpva?: boolean;
    includeLicensing?: boolean;
  };
  contractMonths?: number;
}

export interface QuoteContextType {
  quoteForm: QuoteFormData;
  setClient: (client: Client | null) => void;
  addVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  removeVehicle: (vehicleId: string) => void;
  setGlobalContractMonths: (contractMonths: number) => void;
  setGlobalMonthlyKm: (monthlyKm: number) => void;
  setGlobalOperationSeverity: (operationSeverity: 1|2|3|4|5|6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setGlobalProtectionPlanId: (protectionPlanId: string | null) => void;
  setGlobalIncludeIpva: (includeIpva: boolean) => void;
  setGlobalIncludeLicensing: (includeLicensing: boolean) => void;
  setUseGlobalParams: (useGlobalParams: boolean) => void;
  setVehicleParams: (vehicleId: string, params: Partial<QuoteParams>) => void;
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
  canEditQuote: (quoteId: string) => boolean;
  canDeleteQuote: (quoteId: string) => boolean;
  sendQuoteByEmail: (quoteId: string, email: string, message?: string) => Promise<boolean>;
  savedQuotes: SavedQuote[];
}

export type UserRole = 'user' | 'admin' | 'manager' | 'supervisor';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastLogin: string;
}

export const defaultUser: User = {
  id: 0,
  name: 'Sistema',
  email: 'sistema@sistema.com',
  role: 'user',
  status: 'active',
  lastLogin: new Date().toISOString()
};

export interface EditRecord {
  editedAt: string;
  editedBy: string;
  changes: string;
}

export interface VehicleQuoteResult {
  vehicleId: string;
  totalCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  extraKmRate: number;
}

export interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName: string;
  value: number;
  createdAt: string;
  status: string;
  contractMonths: number;
  createdBy?: {
    id: number;
    name: string;
    role: string;
  };
}
