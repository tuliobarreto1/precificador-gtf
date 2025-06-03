
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { QuoteFormData, SavedQuote, QuoteContextType, QuoteCalculationResult, User, defaultUser, VehicleItem } from './types/quoteTypes';
import { useQuoteUsers } from '@/hooks/useQuoteUsers';
import { useQuoteVehicles } from '@/hooks/useQuoteVehicles';
import { useQuoteParams } from '@/hooks/useQuoteParams';
import { useQuoteCalculation } from '@/hooks/useQuoteCalculation';
import { useQuoteSaving } from '@/hooks/useQuoteSaving';
import { useQuoteData } from '@/hooks/useQuoteData';
import { useQuoteEmails } from '@/hooks/useQuoteEmails';
import { useQuoteAdapters } from '@/hooks/useQuoteAdapters';
import { useToast } from '@/hooks/use-toast';

// Initial state com impostos habilitados por padrão
const initialQuoteForm: QuoteFormData = {
  segment: undefined,
  client: null,
  vehicles: [],
  useGlobalParams: true,
  globalParams: {
    contractMonths: 24,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: false,
    protectionPlanId: null,
    includeIpva: true,      
    includeLicensing: true, 
    includeTaxes: true,     
  },
};

// Criar o contexto com um valor padrão para evitar undefined
const defaultContextValue: QuoteContextType = {
  quoteForm: initialQuoteForm,
  setSegment: () => {},
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
export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>(initialQuoteForm);
  const { toast } = useToast();

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
    setSegment,
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
    calculateQuoteSync
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
  
  // Hooks extraídos
  const { sendQuoteByEmail } = useQuoteEmails(getCurrentUser);

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
    setSegment,
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
    deleteQuote: deleteQuote,
    canEditQuote: (quoteId: string) => {
      const quote = savedQuotes.find(q => q.id === quoteId);
      if (!quote) return false;
      return canEditQuoteById(quote, getCurrentUser());
    },
    canDeleteQuote: (quoteId: string) => {
      const quote = savedQuotes.find(q => q.id === quoteId);
      if (!quote) return false;
      return canDeleteQuoteById(quote, getCurrentUser());
    },
    sendQuoteByEmail: async (quoteId: string, email: string, message: string) => {
      return await sendQuoteByEmail(quoteId, { email, message });
    },
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
