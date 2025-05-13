
// Removendo a referência ao '@prisma/client' que está causando erros

export interface Client {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  responsible?: string;
  contact?: string;
}

// Interface VehicleParams para parâmetros de veículos
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

// Alias para manter compatibilidade com código existente
export type QuoteParams = VehicleParams;

export interface QuoteFormData {
  client: Client | null;
  vehicles: QuoteVehicleItem[];
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
  clientId?: string; 
  totalValue: number;
  totalCost?: number; // Adicionando para compatibilidade
  contractMonths?: number;
  monthlyKm?: number;
  operationSeverity?: number;
  hasTracking?: boolean;
  includeIpva?: boolean;
  includeLicensing?: boolean;
  includeTaxes?: boolean;
  status: string;
  vehicles: SavedVehicle[];
  createdAt: Date | string;
  updatedAt?: Date | string; // Adicionando campo que estava sendo usado
  createdBy?: {
    id: string; // Mudando para string para compatibilidade
    name: string;
    email?: string;
    role?: string;
  };
  globalParams?: VehicleParams;
  source?: string; // Adicionando para compatibilidade
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
}

// Definindo UserRole como tipo
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
  id: string;  // Garantindo que o campo id é obrigatório
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
  vehicleGroupId?: string;
  groupId?: string; // Adicionando para compatibilidade
}

// Interface para item de orçamento na lista
export interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName?: string;
  value?: number;
  status: string;
  createdAt: string | Date;
  contractMonths?: number;
  createdBy?: {
    id: string; // Mudando para string para compatibilidade
    name: string;
    email?: string;
    role?: string;
  };
}

// Interface para item de veículo no orçamento
export interface QuoteVehicleItem {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  params: VehicleParams | null;
}

// Interface para veículo
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  plateNumber?: string;
  status?: string;
  isUsed?: boolean; // Adicionando para compatibilidade
  groupId?: string; // Adicionando para compatibilidade
}

// Interface para grupo de veículos
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

// Interface para registros de edição
export interface EditRecord {
  id: string;
  type: string;
  data: any;
  editedAt?: string; // Adicionando para compatibilidade
}
