
import { Client, Vehicle, VehicleGroup } from '@/lib/models';

export interface QuoteParams {
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1|2|3|4|5|6;
  hasTracking: boolean;
  protectionPlanId?: string | null; // Nova propriedade para o plano de proteção
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
  protectionCost?: number; // Novo campo para custo da proteção
  protectionPlanId?: string | null; // ID do plano de proteção
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
  protectionPlanId?: string | null; // Nova propriedade para o plano de proteção
  protectionCost?: number; // Novo campo para custo da proteção
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
  globalParams?: {
    contractMonths: number;
    monthlyKm: number;
    operationSeverity: number;
    hasTracking: boolean;
    protectionPlanId?: string | null; // Nova propriedade para o plano de proteção global
  };
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
  setGlobalProtectionPlanId: (protectionPlanId: string | null) => void; // Novo método
  setUseGlobalParams: (useGlobalParams: boolean) => void;
  setVehicleParams: (vehicleId: string, params: Partial<QuoteParams>) => void;
  resetForm: () => void;
  calculateQuote: () => QuoteCalculationResult | null;
  saveQuote: () => boolean;
  getCurrentUser: () => string;
  setCurrentUser: (user: string) => void;
  availableUsers: string[];
  isEditMode: boolean;
  currentEditingQuoteId: string | null;
  getClientById: (clientId: string) => Promise<Client | null>;
  getVehicleById: (vehicleId: string) => Promise<Vehicle | null>;
  loadQuoteForEditing: (quoteId: string) => boolean;
  deleteQuote: (quoteId: string) => Promise<boolean>;
  canEditQuote: (quoteId: string) => boolean;
  canDeleteQuote: (quoteId: string) => boolean;
  sendQuoteByEmail: (quoteId: string, email: string, message?: string) => Promise<boolean>;
  savedQuotes: SavedQuote[];
}
