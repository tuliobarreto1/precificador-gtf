
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Vehicle, Client, VehicleGroup } from '@/lib/mock-data';
import { DepreciationParams, MaintenanceParams, calculateLeaseCost, calculateExtraKmRate } from '@/lib/calculation';

// Quote form state
export type QuoteFormData = {
  client: Client | null;
  vehicle: Vehicle | null;
  vehicleGroup: VehicleGroup | null;
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
  hasTracking: boolean;
};

// Context type
type QuoteContextType = {
  quoteForm: QuoteFormData;
  setClient: (client: Client | null) => void;
  setVehicle: (vehicle: Vehicle | null, vehicleGroup: VehicleGroup | null) => void;
  setContractMonths: (months: number) => void;
  setMonthlyKm: (km: number) => void;
  setOperationSeverity: (severity: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setHasTracking: (hasTracking: boolean) => void;
  resetForm: () => void;
  calculateQuote: () => {
    depreciationCost: number;
    maintenanceCost: number;
    trackingCost: number;
    totalCost: number;
    costPerKm: number;
    extraKmRate: number;
  } | null;
};

// Create context
const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// Initial state
const initialQuoteForm: QuoteFormData = {
  client: null,
  vehicle: null,
  vehicleGroup: null,
  contractMonths: 24,
  monthlyKm: 3000,
  operationSeverity: 3,
  hasTracking: false,
};

// Provider component
export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>(initialQuoteForm);

  // Update functions
  const setClient = (client: Client | null) => {
    setQuoteForm(prev => ({ ...prev, client }));
  };

  const setVehicle = (vehicle: Vehicle | null, vehicleGroup: VehicleGroup | null) => {
    setQuoteForm(prev => ({ ...prev, vehicle, vehicleGroup }));
  };

  const setContractMonths = (contractMonths: number) => {
    setQuoteForm(prev => ({ ...prev, contractMonths }));
  };

  const setMonthlyKm = (monthlyKm: number) => {
    setQuoteForm(prev => ({ ...prev, monthlyKm }));
  };

  const setOperationSeverity = (operationSeverity: 1 | 2 | 3 | 4 | 5 | 6) => {
    setQuoteForm(prev => ({ ...prev, operationSeverity }));
  };

  const setHasTracking = (hasTracking: boolean) => {
    setQuoteForm(prev => ({ ...prev, hasTracking }));
  };

  const resetForm = () => {
    setQuoteForm(initialQuoteForm);
  };

  // Calculate quote
  const calculateQuote = () => {
    const { vehicle, vehicleGroup, contractMonths, monthlyKm, operationSeverity, hasTracking } = quoteForm;
    
    if (!vehicle || !vehicleGroup) return null;
    
    const depreciationParams: DepreciationParams = {
      vehicleValue: vehicle.value,
      contractMonths,
      monthlyKm,
      operationSeverity,
    };
    
    const maintenanceParams: MaintenanceParams = {
      vehicleGroup: vehicleGroup.id,
      contractMonths,
      monthlyKm,
      hasTracking,
    };
    
    const result = calculateLeaseCost(depreciationParams, maintenanceParams);
    
    // Calculate extra km rate using the utility function
    const extraKmRate = calculateExtraKmRate(vehicle.value);
    
    return {
      ...result,
      extraKmRate
    };
  };

  return (
    <QuoteContext.Provider value={{
      quoteForm,
      setClient,
      setVehicle,
      setContractMonths,
      setMonthlyKm,
      setOperationSeverity,
      setHasTracking,
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
