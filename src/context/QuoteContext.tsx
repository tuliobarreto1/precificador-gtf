import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Vehicle, Client, VehicleGroup, getVehicleGroupById } from '@/lib/mock-data';
import { DepreciationParams, MaintenanceParams, calculateLeaseCost, calculateExtraKmRate } from '@/lib/calculation';

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
    id: string;
    name: string;
    role: 'user' | 'manager' | 'admin';
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
  createdBy?: {
    id: string;
    name: string;
    role: 'user' | 'manager' | 'admin';
  };
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
};

// Mock do usuário atual
export const currentUser = {
  id: "usr1",
  name: "João Silva",
  role: "user" as 'user' | 'manager' | 'admin'
};

// Outros usuários de exemplo para simulação
export const mockUsers = [
  currentUser,
  { id: "usr2", name: "Maria Oliveira", role: "manager" as 'user' | 'manager' | 'admin' },
  { id: "usr3", name: "Carlos Santos", role: "admin" as 'user' | 'manager' | 'admin' }
];

// Context type
type QuoteContextType = {
  quoteForm: QuoteFormData;
  setClient: (client: Client | null) => void;
  addVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  removeVehicle: (vehicleId: string) => void;
  setGlobalContractMonths: (months: number) => void;
  setGlobalMonthlyKm: (km: number) => void;
  setGlobalOperationSeverity: (severity: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setUseGlobalParams: (useGlobal: boolean) => void;
  setVehicleParams: (
    vehicleId: string, 
    params: {
      contractMonths?: number;
      monthlyKm?: number;
      operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
      hasTracking?: boolean;
    }
  ) => void;
  resetForm: () => void;
  calculateQuote: () => {
    vehicleResults: VehicleQuoteResult[];
    totalCost: number;
  } | null;
  savedQuotes: SavedQuote[];
  saveQuote: () => boolean;
  getSavedQuotes: () => SavedQuote[];
  deleteQuote: (quoteId: string) => boolean;
  getCurrentUser: () => typeof currentUser;
  canEditQuote: (quote: SavedQuote) => boolean;
  canDeleteQuote: (quote: SavedQuote) => boolean;
  updateQuote: (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string) => boolean;
};

// Create context
const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// Initial state
const initialQuoteForm: QuoteFormData = {
  client: null,
  vehicles: [],
  useGlobalParams: true,
  globalParams: {
    contractMonths: 24,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: false,
  },
};

// Local Storage key
const SAVED_QUOTES_KEY = 'savedQuotes';

// Provider component
export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>(initialQuoteForm);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);

  // Carregar cotações salvas do localStorage na inicialização
  useEffect(() => {
    const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
    if (storedQuotes) {
      try {
        const parsedQuotes = JSON.parse(storedQuotes);
        setSavedQuotes(parsedQuotes);
      } catch (error) {
        console.error('Erro ao carregar cotações salvas:', error);
      }
    }
  }, []);

  // Update functions
  const setClient = (client: Client | null) => {
    setQuoteForm(prev => ({ ...prev, client }));
  };

  const addVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    setQuoteForm(prev => {
      // Verificar se o veículo já existe na lista
      if (prev.vehicles.some(item => item.vehicle.id === vehicle.id)) {
        return prev; // Não fazer nada se o veículo já estiver na lista
      }
      
      // Criar um novo veículo com parâmetros globais como base
      const newVehicleItem: QuoteVehicleItem = {
        vehicle,
        vehicleGroup,
        params: !prev.useGlobalParams ? { ...prev.globalParams } : undefined
      };

      console.log('Adicionando veículo:', newVehicleItem);
      
      return {
        ...prev,
        vehicles: [...prev.vehicles, newVehicleItem],
      };
    });
  };

  const removeVehicle = (vehicleId: string) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(item => item.vehicle.id !== vehicleId),
    }));
  };

  const setGlobalContractMonths = (contractMonths: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, contractMonths },
    }));
  };

  const setGlobalMonthlyKm = (monthlyKm: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, monthlyKm },
    }));
  };

  const setGlobalOperationSeverity = (operationSeverity: 1 | 2 | 3 | 4 | 5 | 6) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, operationSeverity },
    }));
  };

  const setGlobalHasTracking = (hasTracking: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, hasTracking },
    }));
  };

  const setUseGlobalParams = (useGlobalParams: boolean) => {
    setQuoteForm(prev => ({ ...prev, useGlobalParams }));
  };

  const setVehicleParams = (
    vehicleId: string, 
    params: {
      contractMonths?: number;
      monthlyKm?: number;
      operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
      hasTracking?: boolean;
    }
  ) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(item => {
        if (item.vehicle.id === vehicleId) {
          return {
            ...item,
            params: {
              ...(item.params || prev.globalParams),
              ...params
            }
          };
        }
        return item;
      }),
    }));
  };

  const resetForm = () => {
    setQuoteForm(initialQuoteForm);
  };

  // Função para obter o usuário atual
  const getCurrentUser = () => {
    return currentUser;
  };

  // Verificar se um usuário pode editar um orçamento
  const canEditQuote = (quote: SavedQuote) => {
    const user = getCurrentUser();
    
    // Se não houver informações sobre quem criou, permitir edição para todos (para fins de demo)
    if (!quote.createdBy) {
      return true;
    }
    
    // Caso contrário, verificar se o usuário atual é o criador ou tem permissões elevadas
    return quote.createdBy.id === user.id || user.role === 'manager' || user.role === 'admin';
  };

  // Verificar se um usuário pode excluir um orçamento
  const canDeleteQuote = (quote: SavedQuote) => {
    const user = getCurrentUser();
    
    // Se não houver informações sobre quem criou, permitir exclusão para todos (para fins de demo)
    if (!quote.createdBy) {
      return true;
    }
    
    // Caso contrário, verificar se o usuário atual é o criador ou tem permissões elevadas
    return quote.createdBy.id === user.id || user.role === 'manager' || user.role === 'admin';
  };

  // Calculate quote
  const calculateQuote = () => {
    const { vehicles, globalParams, useGlobalParams } = quoteForm;
    
    if (vehicles.length === 0) return null;
    
    const vehicleResults: VehicleQuoteResult[] = vehicles.map(item => {
      // Usar parâmetros globais ou específicos do veículo
      const params = useGlobalParams ? globalParams : (item.params || globalParams);
      
      const depreciationParams: DepreciationParams = {
        vehicleValue: item.vehicle.value,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        operationSeverity: params.operationSeverity,
      };
      
      const maintenanceParams: MaintenanceParams = {
        vehicleGroup: item.vehicleGroup.id,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        hasTracking: params.hasTracking,
      };
      
      const result = calculateLeaseCost(depreciationParams, maintenanceParams);
      const extraKmRate = calculateExtraKmRate(item.vehicle.value);
      
      return {
        vehicleId: item.vehicle.id,
        ...result,
        extraKmRate
      };
    });
    
    // Calcular custo total de todos os veículos
    const totalCost = vehicleResults.reduce((sum, result) => sum + result.totalCost, 0);
    
    return {
      vehicleResults,
      totalCost
    };
  };

  // Função para salvar um orçamento
  const saveQuote = (): boolean => {
    const quoteResult = calculateQuote();
    if (!quoteForm.client || !quoteResult || quoteForm.vehicles.length === 0) {
      console.error('Erro ao salvar orçamento: dados incompletos');
      return false;
    }

    // Criar um ID único baseado no timestamp
    const newId = Date.now().toString();
    
    // Criar o objeto de orçamento salvo
    const newSavedQuote: SavedQuote = {
      id: newId,
      clientId: quoteForm.client.id,
      clientName: quoteForm.client.name,
      vehicleId: quoteForm.vehicles[0].vehicle.id, // Para compatibilidade com o formato atual
      vehicleBrand: quoteForm.vehicles[0].vehicle.brand,
      vehicleModel: quoteForm.vehicles[0].vehicle.model,
      contractMonths: quoteForm.globalParams.contractMonths,
      monthlyKm: quoteForm.globalParams.monthlyKm,
      totalCost: quoteResult.totalCost,
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser(),
      editHistory: [],
      vehicles: quoteResult.vehicleResults.map((result, index) => {
        const vehicle = quoteForm.vehicles.find(v => v.vehicle.id === result.vehicleId);
        if (!vehicle) {
          throw new Error(`Veículo não encontrado: ${result.vehicleId}`);
        }
        
        return {
          vehicleId: vehicle.vehicle.id,
          vehicleBrand: vehicle.vehicle.brand,
          vehicleModel: vehicle.vehicle.model,
          plateNumber: vehicle.vehicle.plateNumber,
          groupId: vehicle.vehicleGroup.id,
          totalCost: result.totalCost,
          depreciationCost: result.depreciationCost,
          maintenanceCost: result.maintenanceCost,
          extraKmRate: result.extraKmRate,
        };
      }),
      operationSeverity: quoteForm.globalParams.operationSeverity,
      hasTracking: quoteForm.globalParams.hasTracking,
      trackingCost: quoteResult.vehicleResults[0].trackingCost,
    };

    // Atualizar o estado e o localStorage
    const updatedQuotes = [newSavedQuote, ...savedQuotes];
    setSavedQuotes(updatedQuotes);
    
    // Salvar no localStorage com tratamento de erro
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      console.log('Orçamento salvo com sucesso:', newSavedQuote);
      console.log('Total de orçamentos salvos:', updatedQuotes.length);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
    
    return true;
  };

  // Função para atualizar um orçamento existente
  const updateQuote = (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string): boolean => {
    // Encontrar o orçamento a ser atualizado
    const quoteToUpdate = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToUpdate) return false;
    
    // Verificar permissão
    if (!canEditQuote(quoteToUpdate)) return false;
    
    // Recalcular os custos, se necessário
    // Simplificado para este exemplo - em uma implementação real, precisaria recriar 
    // a lógica de cálculo com base nas atualizações
    
    // Registrar a edição no histórico
    const editRecord: EditRecord = {
      editedAt: new Date().toISOString(),
      editedBy: getCurrentUser(),
      changes: changeDescription
    };
    
    // Atualizar o orçamento
    const updatedQuotes = savedQuotes.map(quote => {
      if (quote.id === quoteId) {
        return {
          ...quote,
          // Aqui adicionaríamos as atualizações específicas baseadas no objeto updates,
          // mas mantendo simples para o exemplo
          editHistory: [...(quote.editHistory || []), editRecord]
        };
      }
      return quote;
    });
    
    // Salvar as alterações
    setSavedQuotes(updatedQuotes);
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
    
    return true;
  };

  // Função para excluir um orçamento
  const deleteQuote = (quoteId: string): boolean => {
    // Encontrar o orçamento a ser excluído
    const quoteToDelete = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToDelete) return false;
    
    // Verificar permissão
    if (!canDeleteQuote(quoteToDelete)) return false;
    
    // Remover o orçamento
    const updatedQuotes = savedQuotes.filter(quote => quote.id !== quoteId);
    setSavedQuotes(updatedQuotes);
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
    
    return true;
  };

  // Função para obter orçamentos salvos
  const getSavedQuotes = () => {
    // Tentar recuperar diretamente do localStorage para garantir dados mais recentes
    try {
      const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
      if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes);
        return parsedQuotes;
      }
    } catch (error) {
      console.error('Erro ao recuperar orçamentos do localStorage:', error);
    }
    
    // Se não conseguir recuperar do localStorage, usar o estado
    return savedQuotes;
  };

  return (
    <QuoteContext.Provider value={{
      quoteForm,
      setClient,
      addVehicle,
      removeVehicle,
      setGlobalContractMonths,
      setGlobalMonthlyKm,
      setGlobalOperationSeverity,
      setGlobalHasTracking,
      setUseGlobalParams,
      setVehicleParams,
      resetForm,
      calculateQuote,
      savedQuotes,
      saveQuote,
      getSavedQuotes,
      deleteQuote,
      getCurrentUser,
      canEditQuote,
      canDeleteQuote,
      updateQuote,
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

// Hook to use the quote context
export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};
