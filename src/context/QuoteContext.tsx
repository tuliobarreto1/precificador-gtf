
import React, { createContext, useContext, useState, ReactNode } from 'react';
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

// Provider component
export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>(initialQuoteForm);

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
      
      return {
        ...prev,
        vehicles: [...prev.vehicles, { vehicle, vehicleGroup }],
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
