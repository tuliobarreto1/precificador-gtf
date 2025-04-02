
import { Client, Vehicle, VehicleGroup } from '@/lib/models';

// Tipos de usuário
export type UserRole = 'user' | 'manager' | 'admin';

// Tipo de usuário
export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastLogin: string;
};

// Item de veículo na cotação
export type QuoteVehicleItem = {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  params?: {
    contractMonths: number;
    monthlyKm: number;
    operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
    hasTracking: boolean;
  };
};

// Quote form state
export type QuoteFormData = {
  client: Client | null;
  vehicles: QuoteVehicleItem[];
  useGlobalParams: boolean;
  globalParams: {
    contractMonths: number;
    monthlyKm: number;
    operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
    hasTracking: boolean;
  };
};

// Tipo para registro de edição
export type EditRecord = {
  editedAt: string;
  editedBy: {
    id: number;
    name: string;
    role: UserRole;
  };
  changes: string;
};

// Resultado do cálculo para um veículo
export type VehicleQuoteResult = {
  vehicleId: string;
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  totalCost: number;
  costPerKm: number;
  extraKmRate: number;
};

// Interface para orçamentos salvos
export type SavedQuote = {
  id: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  contractMonths: number;
  monthlyKm: number;
  totalCost: number;
  createdAt: string;
  createdBy?: User;
  editHistory?: EditRecord[];
  vehicles: {
    vehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    plateNumber?: string;
    groupId: string;
    totalCost: number;
    depreciationCost: number;
    maintenanceCost: number;
    extraKmRate: number;
  }[];
  operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
  hasTracking?: boolean;
  trackingCost?: number;
  status?: string;
  source?: 'local' | 'supabase' | 'demo';
};

// Usuários do sistema (alinhados com a página de Usuários)
export const mockUsers: User[] = [
  { id: 1, name: 'Admin Principal', email: 'admin@carleasemaster.com.br', role: 'admin', status: 'active', lastLogin: '2023-10-15 14:30' },
  { id: 2, name: 'Gerente de Vendas', email: 'gerente@carleasemaster.com.br', role: 'manager', status: 'active', lastLogin: '2023-10-14 09:15' },
  { id: 3, name: 'Usuário Teste', email: 'teste@carleasemaster.com.br', role: 'user', status: 'active', lastLogin: '2023-10-10 16:45' },
  { id: 4, name: 'Consultor 1', email: 'consultor1@carleasemaster.com.br', role: 'user', status: 'active', lastLogin: '2023-10-09 11:20' },
  { id: 5, name: 'Usuário Inativo', email: 'inativo@carleasemaster.com.br', role: 'user', status: 'inactive', lastLogin: '2023-09-25 10:30' }
];

// Definir usuário padrão (primeiro usuário ativo admin)
export const defaultUser = mockUsers.find(user => user.status === 'active' && user.role === 'admin') || mockUsers[0];

export interface QuoteContextType {
  quoteForm: QuoteFormData;
  setClient: (client: Client | null) => void;
  addVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  removeVehicle: (vehicleId: string) => void;
  setGlobalContractMonths: (contractMonths: number) => void;
  setGlobalMonthlyKm: (monthlyKm: number) => void;
  setGlobalOperationSeverity: (operationSeverity: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setUseGlobalParams: (useGlobalParams: boolean) => void;
  setVehicleParams: (vehicleId: string, params: {
    contractMonths?: number;
    monthlyKm?: number;
    operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
    hasTracking?: boolean;
  }) => void;
  resetForm: () => void;
  calculateQuote: () => {
    vehicleResults: VehicleQuoteResult[];
    totalCost: number;
  } | null;
  saveQuote: () => boolean;
  getCurrentUser: () => User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  isEditMode: boolean;
  currentEditingQuoteId: string | null;
  getClientById: (id: string) => Client;
  getVehicleById: (id: string) => Vehicle;
  loadQuoteForEditing: (quoteId: string) => Promise<boolean>;
  deleteQuote: (quoteId: string) => Promise<boolean>;
  canEditQuote: (quote: any) => boolean;
  canDeleteQuote: (quote: any) => boolean;
  sendQuoteByEmail: (quoteId: string, email: string, message: string) => Promise<boolean>;
  sendingEmail: boolean;
  savedQuotes: SavedQuote[];
}
