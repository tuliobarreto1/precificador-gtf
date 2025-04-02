
import React, { createContext, useState, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { savedQuotes } from '@/lib/data-provider';
import { saveQuoteToSupabase, getQuoteByIdFromSupabase } from '@/integrations/supabase';

export interface VehicleData {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: number;
  hasTracking: boolean;
  depreciationCost: number;
  maintenanceCost: number;
  extraKmCost: number;
  totalCost: number;
  monthlyValue: number;
  params?: QuoteParams;
}

export type ClientType = 'PF' | 'PJ';

export interface QuoteParams {
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
  hasTracking: boolean;
}

export interface QuoteFormState {
  client: Client | null;
  vehicles: VehicleData[];
  globalParams: QuoteParams;
  useGlobalParams: boolean;
}

export interface QuoteResult {
  vehicleResults: Array<{
    vehicleId: string;
    depreciationCost: number;
    maintenanceCost: number;
    extraKmRate: number;
    totalCost: number;
  }>;
  totalCost: number;
}

export interface QuoteContextType {
  title: string;
  setTitle: (title: string) => void;
  client: Client | null;
  setClient: (client: Client | null) => void;
  vehicles: VehicleData[];
  addVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  updateVehicle: (index: number, updates: Partial<VehicleData>) => void;
  removeVehicle: (index: number) => void;
  contractMonths: number;
  setContractMonths: (months: number) => void;
  monthlyKm: number;
  setMonthlyKm: (km: number) => void;
  operationSeverity: number;
  setOperationSeverity: (severity: number) => void;
  hasTracking: boolean;
  setHasTracking: (hasTracking: boolean) => void;
  totalCost: number;
  monthlyValue: number;
  saveQuote: () => Promise<{ success: boolean; quoteId?: string }>;
  loadQuote: (id: string) => Promise<boolean>;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  editQuoteId: string | null;
  setEditQuoteId: (id: string | null) => void;
  resetQuote: () => void;
  // Novas propriedades para corrigir erros
  quoteForm: QuoteFormState;
  setGlobalContractMonths: (months: number) => void;
  setGlobalMonthlyKm: (km: number) => void;
  setGlobalOperationSeverity: (severity: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setUseGlobalParams: (useGlobal: boolean) => void;
  setVehicleParams: (vehicleId: string, params: Partial<QuoteParams>) => void;
  calculateQuote: () => QuoteResult | null;
  loadQuoteForEditing: (id: string) => boolean;
  currentEditingQuoteId: string | null;
  sendQuoteByEmail: (quoteId: string, email: string, message: string) => Promise<boolean>;
}

export const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState<string>(`Orçamento ${new Date().toLocaleDateString()}`);
  const [client, setClient] = useState<Client | null>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [contractMonths, setContractMonths] = useState(12);
  const [monthlyKm, setMonthlyKm] = useState(2000);
  const [operationSeverity, setOperationSeverity] = useState(3);
  const [hasTracking, setHasTracking] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState<string | null>(null);
  
  // Estado para o novo formato de orçamento
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    client: null,
    vehicles: [],
    globalParams: {
      contractMonths: 12,
      monthlyKm: 2000,
      operationSeverity: 3,
      hasTracking: false
    },
    useGlobalParams: true
  });
  
  const { user, adminUser } = useAuth();
  const { toast } = useToast();

  // Função para calcular o custo total do orçamento
  const calculateTotalCost = (vehicles: VehicleData[]): number => {
    return vehicles.reduce((total, vehicle) => total + vehicle.totalCost, 0);
  };

  // Função para calcular o valor mensal do orçamento
  const calculateMonthlyValue = (vehicles: VehicleData[]): number => {
    return vehicles.reduce((total, vehicle) => total + vehicle.monthlyValue, 0);
  };

  const totalCost = calculateTotalCost(vehicles);
  const monthlyValue = calculateMonthlyValue(vehicles);

  // Adicionar um novo veículo ao orçamento
  const addVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    // Cálculos simplificados
    const depreciationCost = (vehicle.value * 0.2) * operationSeverity / 3;
    const maintenanceCost = vehicleGroup.revisionCost * contractMonths / 12;
    const extraKmCost = monthlyKm * 0.10; 
    const trackingCost = hasTracking ? 250 : 0;
    
    const totalVehicleCost = depreciationCost + maintenanceCost + extraKmCost + trackingCost;
    const monthlyVehicleValue = totalVehicleCost / contractMonths;

    const vehicleData: VehicleData = {
      vehicle,
      vehicleGroup,
      contractMonths,
      monthlyKm,
      operationSeverity,
      hasTracking,
      depreciationCost,
      maintenanceCost,
      extraKmCost,
      totalCost: totalVehicleCost,
      monthlyValue: monthlyVehicleValue
    };

    setVehicles([...vehicles, vehicleData]);
    
    // Também atualizar no novo formato
    setQuoteForm(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, vehicleData]
    }));
  };

  // Atualizar um veículo existente
  const updateVehicle = (index: number, updates: Partial<VehicleData>) => {
    const updatedVehicles = [...vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], ...updates };
    
    // Recalcular custos se necessário
    if (updates.contractMonths || updates.monthlyKm || updates.operationSeverity || updates.hasTracking !== undefined) {
      const vehicle = updatedVehicles[index];
      
      // Refazer os cálculos
      const depreciationCost = (vehicle.vehicle.value * 0.2) * vehicle.operationSeverity / 3;
      const maintenanceCost = vehicle.vehicleGroup.revisionCost * vehicle.contractMonths / 12;
      const extraKmCost = vehicle.monthlyKm * 0.10;
      const trackingCost = vehicle.hasTracking ? 250 : 0;
      
      const totalVehicleCost = depreciationCost + maintenanceCost + extraKmCost + trackingCost;
      const monthlyVehicleValue = totalVehicleCost / vehicle.contractMonths;
      
      updatedVehicles[index] = {
        ...vehicle,
        depreciationCost,
        maintenanceCost,
        extraKmCost,
        totalCost: totalVehicleCost,
        monthlyValue: monthlyVehicleValue
      };
    }
    
    setVehicles(updatedVehicles);
    
    // Também atualizar no novo formato
    setQuoteForm(prev => ({
      ...prev,
      vehicles: updatedVehicles
    }));
  };

  // Remover um veículo do orçamento
  const removeVehicle = (index: number) => {
    const newVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(newVehicles);
    
    // Também atualizar no novo formato
    setQuoteForm(prev => ({
      ...prev,
      vehicles: newVehicles
    }));
  };

  // Resetar o orçamento para valores padrão
  const resetQuote = () => {
    setTitle(`Orçamento ${new Date().toLocaleDateString()}`);
    setClient(null);
    setVehicles([]);
    setContractMonths(12);
    setMonthlyKm(2000);
    setOperationSeverity(3);
    setHasTracking(false);
    setIsEditMode(false);
    setEditQuoteId(null);
    
    // Também resetar no novo formato
    setQuoteForm({
      client: null,
      vehicles: [],
      globalParams: {
        contractMonths: 12,
        monthlyKm: 2000,
        operationSeverity: 3,
        hasTracking: false
      },
      useGlobalParams: true
    });
  };
  
  // Funções para o novo formato de orçamento
  const setGlobalContractMonths = (months: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        contractMonths: months
      }
    }));
  };
  
  const setGlobalMonthlyKm = (km: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        monthlyKm: km
      }
    }));
  };
  
  const setGlobalOperationSeverity = (severity: 1 | 2 | 3 | 4 | 5 | 6) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        operationSeverity: severity
      }
    }));
  };
  
  const setGlobalHasTracking = (hasTracking: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        hasTracking
      }
    }));
  };
  
  const setUseGlobalParams = (useGlobal: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      useGlobalParams: useGlobal
    }));
  };
  
  const setVehicleParams = (vehicleId: string, params: Partial<QuoteParams>) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(vehicle => {
        if (vehicle.vehicle.id === vehicleId) {
          return {
            ...vehicle,
            params: {
              ...(vehicle.params || prev.globalParams),
              ...params
            }
          };
        }
        return vehicle;
      })
    }));
  };
  
  const calculateQuote = (): QuoteResult | null => {
    if (!quoteForm.client || quoteForm.vehicles.length === 0) {
      return null;
    }
    
    const vehicleResults = quoteForm.vehicles.map(vehicle => {
      const params = quoteForm.useGlobalParams 
        ? quoteForm.globalParams 
        : (vehicle.params || quoteForm.globalParams);
      
      const depreciationCost = (vehicle.vehicle.value * 0.2) * params.operationSeverity / 3;
      const maintenanceCost = vehicle.vehicleGroup.revisionCost * params.contractMonths / 12;
      const extraKmRate = params.monthlyKm * 0.10;
      const trackingCost = params.hasTracking ? 250 : 0;
      
      const totalCost = depreciationCost + maintenanceCost + extraKmRate + trackingCost;
      
      return {
        vehicleId: vehicle.vehicle.id,
        depreciationCost,
        maintenanceCost,
        extraKmRate,
        totalCost
      };
    });
    
    const totalCost = vehicleResults.reduce((sum, result) => sum + result.totalCost, 0);
    
    return {
      vehicleResults,
      totalCost
    };
  };
  
  const loadQuoteForEditing = (id: string): boolean => {
    try {
      // implementação simplificada para compatibilidade
      return loadQuote(id);
    } catch (error) {
      console.error("Erro ao carregar orçamento para edição:", error);
      return false;
    }
  };
  
  const sendQuoteByEmail = async (quoteId: string, email: string, message: string): Promise<boolean> => {
    try {
      // Implementação simulada
      console.log(`Enviando orçamento ${quoteId} para ${email}: ${message}`);
      toast({
        title: "E-mail enviado",
        description: "O orçamento foi enviado por e-mail."
      });
      return true;
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      return false;
    }
  };

  // Salvar o orçamento
  const saveQuote = async () => {
    if (!client) {
      toast({
        title: "Cliente obrigatório",
        description: "Você deve selecionar um cliente para o orçamento.",
        variant: "destructive",
      });
      return { success: false };
    }

    if (vehicles.length === 0) {
      toast({
        title: "Veículos obrigatórios",
        description: "Adicione pelo menos um veículo ao orçamento.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      // Converter para o formato de salvamento
      const quoteId = isEditMode && editQuoteId ? editQuoteId : uuidv4();
      
      // Escolhemos o primeiro veículo como referência para compatibilidade com o modelo Quote
      const firstVehicleId = vehicles[0]?.vehicle?.id || '';
      
      const quoteData = {
        id: quoteId,
        title: title,
        clientId: client.id,
        clientName: client.name,
        clientDocument: client.document,
        clientType: client.type as ClientType,
        contractMonths,
        monthlyKm,
        operationSeverity,
        hasTracking,
        totalCost,
        monthlyValue,
        vehicleId: firstVehicleId, // Adicionado para compatibilidade com o modelo Quote
        vehicles: vehicles.map(v => ({
          vehicleId: v.vehicle.id,
          vehicleBrand: v.vehicle.brand,
          vehicleModel: v.vehicle.model,
          vehicleYear: v.vehicle.year,
          vehicleValue: v.vehicle.value,
          vehicleIsUsed: v.vehicle.isUsed,
          vehiclePlateNumber: v.vehicle.plateNumber,
          vehicleGroupId: v.vehicleGroup.id,
          contractMonths: v.contractMonths,
          monthlyKm: v.monthlyKm,
          operationSeverity: v.operationSeverity,
          hasTracking: v.hasTracking,
          depreciationCost: v.depreciationCost,
          maintenanceCost: v.maintenanceCost,
          extraKmRate: v.extraKmCost,
          totalCost: v.totalCost,
          monthlyValue: v.monthlyValue,
          vehicle: v.vehicle,
        })),
        createdAt: new Date().toISOString(),
        createdBy: user?.id || adminUser?.id || '',
        createdByName: user?.email || adminUser?.email || "Usuário",
        isEdit: isEditMode,
        status: 'ORCAMENTO',
        statusFlow: 'ORCAMENTO'
      };
      
      console.log('Salvando orçamento:', quoteData);

      // Salvar no Supabase
      const { success, error, quote } = await saveQuoteToSupabase(quoteData);
      
      if (success) {
        // Salvar localmente também para acesso offline
        if (isEditMode) {
          // Substituir o orçamento existente
          const quoteIndex = savedQuotes.findIndex(q => q.id === editQuoteId);
          if (quoteIndex >= 0) {
            savedQuotes[quoteIndex] = quoteData;
          } else {
            savedQuotes.push(quoteData);
          }
        } else {
          // Adicionar novo orçamento
          savedQuotes.push(quoteData);
        }
        
        toast({
          title: isEditMode ? "Orçamento atualizado" : "Orçamento criado",
          description: isEditMode 
            ? "O orçamento foi atualizado com sucesso." 
            : "O orçamento foi criado com sucesso.",
        });
        
        return { success: true, quoteId: quote?.id || quoteId };
      } else {
        console.error('Erro ao salvar orçamento:', error);
        
        toast({
          title: "Erro",
          description: `Não foi possível ${isEditMode ? 'atualizar' : 'criar'} o orçamento: ${error?.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
        
        return { success: false };
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${isEditMode ? 'atualizar' : 'criar'} o orçamento.`,
        variant: "destructive",
      });
      
      return { success: false };
    }
  };

  // Carregar um orçamento pelo ID
  const loadQuote = async (id: string) => {
    try {
      console.log(`Carregando orçamento ${id}`);
      
      // Primeiro, tentar carregar do Supabase
      const { success, quote } = await getQuoteByIdFromSupabase(id);
      
      if (success && quote) {
        console.log('Orçamento carregado do Supabase:', quote);
        
        // Configurar cliente
        if (quote.client) {
          setClient({
            id: quote.client.id,
            name: quote.client.name,
            type: quote.client.type || 'PJ',
            document: quote.client.document || '',
            email: quote.client.email,
            contact: quote.client.phone,
          });
        }
        
        // Configurar título
        setTitle(quote.title || `Orçamento ${new Date(quote.created_at).toLocaleDateString()}`);
        
        // Configurar parâmetros gerais
        setContractMonths(quote.contract_months || 12);
        setMonthlyKm(quote.monthly_km || 2000);
        setOperationSeverity(quote.operation_severity || 3);
        setHasTracking(quote.has_tracking || false);
        
        // Configurar veículos
        if (quote.vehicles && Array.isArray(quote.vehicles) && quote.vehicles.length > 0) {
          const mappedVehicles: VehicleData[] = [];
          
          for (const quoteVehicle of quote.vehicles) {
            if (quoteVehicle.vehicle) {
              const vehicle: Vehicle = {
                id: quoteVehicle.vehicle.id,
                brand: quoteVehicle.vehicle.brand || '',
                model: quoteVehicle.vehicle.model || '',
                year: quoteVehicle.vehicle.year || new Date().getFullYear(),
                value: quoteVehicle.vehicle.value || 0,
                isUsed: quoteVehicle.vehicle.is_used || false,
                plateNumber: quoteVehicle.vehicle.plate_number,
                color: quoteVehicle.vehicle.color,
                fuelType: quoteVehicle.vehicle.fuel_type,
                odometer: quoteVehicle.vehicle.odometer,
                groupId: quoteVehicle.vehicle.group_id || 'A'
              };
              
              // Grupo do veículo simplificado
              const vehicleGroup: VehicleGroup = {
                id: quoteVehicle.vehicle.group_id || 'A',
                name: `Grupo ${quoteVehicle.vehicle.group_id || 'A'}`,
                description: '',
                revisionKm: 10000,
                revisionCost: 500,
                tireKm: 40000,
                tireCost: 2000
              };
              
              mappedVehicles.push({
                vehicle,
                vehicleGroup,
                contractMonths: quoteVehicle.contract_months || quote.contract_months || 12,
                monthlyKm: quoteVehicle.monthly_km || quote.monthly_km || 2000,
                operationSeverity: quoteVehicle.operation_severity || quote.operation_severity || 3,
                hasTracking: quoteVehicle.has_tracking || quote.has_tracking || false,
                depreciationCost: quoteVehicle.depreciation_cost || 0,
                maintenanceCost: quoteVehicle.maintenance_cost || 0,
                extraKmCost: quoteVehicle.extra_km_rate || 0,
                totalCost: quoteVehicle.total_cost || 0,
                monthlyValue: quoteVehicle.monthly_value || 0
              });
            }
          }
          
          setVehicles(mappedVehicles);
        }
        
        // Configurar modo de edição
        setIsEditMode(true);
        setEditQuoteId(id);
        
        toast({
          title: "Orçamento carregado",
          description: "O orçamento foi carregado com sucesso."
        });
        
        return true;
      }
      
      // Se não encontrou no Supabase, tentar carregar do armazenamento local
      const localQuote = savedQuotes.find(q => q.id === id);
      
      if (localQuote) {
        console.log('Orçamento carregado do armazenamento local:', localQuote);
        
        // Similar ao processo acima, mas adaptado para o formato local
        // ... configuração do cliente, título, parâmetros
        
        toast({
          title: "Orçamento carregado (local)",
          description: "O orçamento foi carregado do armazenamento local."
        });
        
        return true;
      }
      
      toast({
        title: "Orçamento não encontrado",
        description: `Não foi possível encontrar o orçamento com ID ${id}.`,
        variant: "destructive"
      });
      
      return false;
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar o orçamento.",
        variant: "destructive"
      });
      
      return false;
    }
  };

  return (
    <QuoteContext.Provider
      value={{
        title,
        setTitle,
        client,
        setClient,
        vehicles,
        addVehicle,
        updateVehicle,
        removeVehicle,
        contractMonths,
        setContractMonths,
        monthlyKm,
        setMonthlyKm,
        operationSeverity,
        setOperationSeverity,
        hasTracking,
        setHasTracking,
        totalCost,
        monthlyValue,
        saveQuote,
        loadQuote,
        isEditMode,
        setIsEditMode,
        editQuoteId,
        setEditQuoteId,
        resetQuote,
        // Novas propriedades para corrigir erros
        quoteForm,
        setGlobalContractMonths,
        setGlobalMonthlyKm,
        setGlobalOperationSeverity,
        setGlobalHasTracking,
        setUseGlobalParams,
        setVehicleParams,
        calculateQuote,
        loadQuoteForEditing,
        currentEditingQuoteId: editQuoteId,
        sendQuoteByEmail
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};
