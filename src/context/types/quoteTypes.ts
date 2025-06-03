
import { Client, Vehicle, VehicleGroup } from '@/lib/models';

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

export interface VehicleItem {
  vehicle: Vehicle;
  params?: VehicleParams;
  vehicleGroup?: VehicleGroup;
}

export interface CustomClient {
  id?: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string;
  email?: string;
  contact?: string;
  responsible?: string;
}

export interface QuoteFormData {
  segment?: 'GTF' | 'Assinatura';
  client: Client | CustomClient | null;
  vehicles: VehicleItem[];
  useGlobalParams: boolean;
  globalParams: VehicleParams;
}

export interface QuoteVehicleResult {
  vehicleId: string;
  depreciationCost: number;
  maintenanceCost: number;
  extraKmRate: number;
  protectionCost: number;
  ipvaCost: number;
  licensingCost: number;
  taxCost: number;
  totalCost: number;
  includeIpva: boolean;
  includeLicensing: boolean;
  includeTaxes: boolean;
  protectionPlanId?: string | null;
  contractMonths?: number;
  monthlyKm?: number;
}

export interface QuoteCalculationResult {
  vehicleResults: QuoteVehicleResult[];
  totalCost: number;
}

export interface SavedQuoteVehicle {
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  totalCost: number;
  contractMonths: number;
  monthlyKm: number;
  ipvaCost?: number;
  licensingCost?: number;
  taxCost?: number;
  plateNumber?: string;
  vehicleGroupId?: string;
  groupId?: string;
  vehicleValue?: number;
  protectionPlanId?: string | null;
  includeIpva?: boolean;
  includeLicensing?: boolean;
  includeTaxes?: boolean;
}

export interface SavedQuote {
  id: string;
  clientId: string;
  clientName: string;
  vehicles: SavedQuoteVehicle[];
  totalValue: number;
  createdAt: string;
  updatedAt?: string;
  status: string;
  source?: 'local' | 'supabase';
  globalParams?: VehicleParams;
  contractMonths?: number;
  monthlyKm?: number;
  createdBy?: {
    id: string;
    name: string;
  };
}

export type UserRole = 'admin' | 'supervisor' | 'user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  status?: string;
}

export const defaultUser: User = {
  id: 'user-1',
  name: 'Usuário Padrão',
  role: 'user'
};

export interface EditRecord {
  id: string;
  type: 'quote' | 'vehicle' | 'client';
  timestamp: string;
  userId: string;
  userName: string;
  description: string;
  data: any;
}

// Tipos adicionais que estavam ausentes
export interface QuoteParams extends VehicleParams {}
export interface QuoteVehicleItem extends VehicleItem {}
export interface QuoteResultVehicle extends QuoteVehicleResult {}
export interface SavedVehicle extends SavedQuoteVehicle {}
export interface QuoteItem extends SavedQuote {}

export interface QuoteContextType {
  quoteForm: QuoteFormData;
  setSegment: (segment: 'GTF' | 'Assinatura' | undefined) => void;
  setClient: (client: Client | CustomClient | null) => void;
  addVehicle: (vehicle: Vehicle, vehicleGroup?: VehicleGroup) => void;
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
  setVehicleParams: (vehicleId: string, params: VehicleParams) => void;
  resetForm: () => void;
  calculateQuote: () => QuoteCalculationResult | null;
  saveQuote: () => Promise<boolean>;
  getCurrentUser: () => User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  isEditMode: boolean;
  currentEditingQuoteId: string | null;
  getClientById: (id: string) => Promise<Client | null>;
  getVehicleById: (id: string) => Promise<Vehicle | null>;
  loadQuoteForEditing: (quoteId: string) => Promise<boolean>;
  deleteQuote: (quoteId: string) => Promise<boolean>;
  canEditQuote: (quoteId: string) => boolean;
  canDeleteQuote: (quoteId: string) => boolean;
  sendQuoteByEmail: (quoteId: string, email: string, message: string) => Promise<boolean>;
  savedQuotes: SavedQuote[];
}
