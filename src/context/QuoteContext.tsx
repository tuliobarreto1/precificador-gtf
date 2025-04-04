
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
    includeIpva: false,     // Novos campos inicializados como false
    includeLicensing: false,
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
  setGlobalIncludeIpva: () => {},     // Novos métodos
  setGlobalIncludeLicensing: () => {},
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
    canEditQuote,
    canDeleteQuote,
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
    setGlobalIncludeIpva,       // Novos métodos
    setGlobalIncludeLicensing,
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
    setGlobalIncludeIpva,        // Novos métodos
    setGlobalIncludeLicensing,
    setUseGlobalParams,
    setVehicleParams,
    resetForm,
    calculateQuote: () => {
      // Use a versão síncrona para evitar problemas de assincronicidade no contexto
      return calculateQuoteSync();
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
    canEditQuote,
    canDeleteQuote,
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
