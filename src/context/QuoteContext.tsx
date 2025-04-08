import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { QuoteFormData, SavedQuote, QuoteContextType, QuoteCalculationResult, User, defaultUser } from './types/quoteTypes';
import { useQuoteUsers } from '@/hooks/useQuoteUsers';
import { useQuoteVehicles } from '@/hooks/useQuoteVehicles';
import { useQuoteParams } from '@/hooks/useQuoteParams';
import { useQuoteCalculation } from '@/hooks/useQuoteCalculation';
import { useQuoteSaving } from '@/hooks/useQuoteSaving';
import { useQuoteData } from '@/hooks/useQuoteData';

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
    protectionPlanId: null,
    includeIpva: false,
    includeLicensing: false,
    includeTaxes: true,  // Habilitando impostos por padrão
  },
};

// Criar o contexto com um valor padrão para evitar undefined
const defaultContextValue: QuoteContextType = {
  quoteForm: initialQuoteForm,
  setClient: () => {},
  addVehicle: () => {},
  removeVehicle: () => {},
  setGlobalContractMonths: () => {},
  setGlobalMonthlyKm: () => {},
  setGlobalOperationSeverity: () => {},
  setGlobalHasTracking: () => {},
  setGlobalProtectionPlanId: () => {},
  setGlobalIncludeIpva: () => {},
  setGlobalIncludeLicensing: () => {},
  setGlobalIncludeTaxes: () => {},
  setUseGlobalParams: () => {},
  setVehicleParams: () => {},
  resetForm: () => {},
  calculateQuote: () => null,
  saveQuote: async () => false,
  getCurrentUser: () => defaultUser,
  setCurrentUser: () => {},
  availableUsers: [],
  isEditMode: false,
  currentEditingQuoteId: null,
  getClientById: async () => null,
  getVehicleById: async () => null,
  loadQuoteForEditing: async () => false,
  deleteQuote: async () => false,
  canEditQuote: () => false,
  canDeleteQuote: () => false,
  sendQuoteByEmail: async () => false,
  savedQuotes: []
};

// Criar o contexto
const QuoteContext = createContext<QuoteContextType>(defaultContextValue);

// Provider component
export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>(initialQuoteForm);
  
  // Utilizando os hooks específicos
  const {
    user,
    getCurrentUser,
    setCurrentUser,
    availableUsers,
    canEditQuote: canEditQuoteById,
    canDeleteQuote: canDeleteQuoteById,
    savedQuotes
  } = useQuoteUsers();
  
  const {
    addVehicle,
    removeVehicle,
    setVehicleParams
  } = useQuoteVehicles(quoteForm, setQuoteForm);
  
  const {
    setGlobalContractMonths,
    setGlobalMonthlyKm,
    setGlobalOperationSeverity,
    setGlobalHasTracking,
    setGlobalProtectionPlanId,
    setGlobalIncludeIpva,
    setGlobalIncludeLicensing,
    setGlobalIncludeTaxes, 
    setUseGlobalParams,
    setClient,
    resetForm
  } = useQuoteParams(quoteForm, setQuoteForm);
  
  const {
    calculateQuote,
    calculateQuoteSync,
    sendQuoteByEmail
  } = useQuoteCalculation(quoteForm);
  
  const {
    isEditMode,
    currentEditingQuoteId,
    saveQuote,
    updateQuote,
    deleteQuote,
    loadQuoteForEditing
  } = useQuoteSaving(quoteForm, calculateQuote, getCurrentUser);
  
  const {
    getClient,
    getVehicle
  } = useQuoteData();

  // Adaptadores para as funções canEditQuote e canDeleteQuote para atender à interface esperada
  const canEditQuoteAdapter = (quote: SavedQuote, user: User): boolean => {
    return canEditQuoteById(quote.id);
  };

  const canDeleteQuoteAdapter = (quote: SavedQuote, user: User): boolean => {
    return canDeleteQuoteById(quote.id);
  };

  // Adicionando log para depurar se os valores de impostos estão definidos corretamente
  useEffect(() => {
    console.log("QuoteContext: Estado atual dos impostos:", {
      includeIpva: quoteForm.globalParams.includeIpva,
      includeLicensing: quoteForm.globalParams.includeLicensing,
      includeTaxes: quoteForm.globalParams.includeTaxes
    });
  }, [quoteForm.globalParams.includeIpva, quoteForm.globalParams.includeLicensing, quoteForm.globalParams.includeTaxes]);

  // Export the context
  const contextValue: QuoteContextType = {
    quoteForm,
    setClient,
    addVehicle,
    removeVehicle,
    setGlobalContractMonths,
    setGlobalMonthlyKm,
    setGlobalOperationSeverity,
    setGlobalHasTracking,
    setGlobalProtectionPlanId,
    setGlobalIncludeIpva,
    setGlobalIncludeLicensing,
    setGlobalIncludeTaxes,
    setUseGlobalParams,
    setVehicleParams,
    resetForm,
    calculateQuote: () => {
      // Use a versão síncrona para evitar problemas de assincronicidade no contexto
      const result = calculateQuoteSync();
      console.log("QuoteContext: Resultado do cálculo:", {
        temVeiculos: result?.vehicleResults?.length,
        custoTotal: result?.totalCost,
        impostos: result?.vehicleResults?.map(v => ({
          veiculo: v.vehicleId,
          ipvaCost: v.ipvaCost, 
          licensingCost: v.licensingCost,
          taxCost: v.taxCost,
          includeIpva: v.includeIpva,
          includeLicensing: v.includeLicensing,
          includeTaxes: v.includeTaxes
        }))
      });
      return result;
    },
    saveQuote: async () => {
      try {
        const result = await saveQuote();
        return result;
      } catch (error) {
        console.error("Erro ao salvar orçamento:", error);
        return false;
      }
    },
    getCurrentUser,
    setCurrentUser,
    availableUsers,
    isEditMode,
    currentEditingQuoteId,
    getClientById: getClient,
    getVehicleById: getVehicle,
    loadQuoteForEditing: async (quoteId: string) => {
      try {
        const result = await Promise.resolve(loadQuoteForEditing(quoteId));
        return result;
      } catch (error) {
        console.error("Erro ao carregar orçamento para edição:", error);
        return false;
      }
    },
    deleteQuote,
    canEditQuote: canEditQuoteAdapter,
    canDeleteQuote: canDeleteQuoteAdapter,
    sendQuoteByEmail,
    savedQuotes
  };

  return (
    <QuoteContext.Provider value={contextValue}>
      {children}
    </QuoteContext.Provider>
  );
};

// Hook para usar o contexto
export const useQuote = () => {
  const context = useContext(QuoteContext);
  return context;
};
