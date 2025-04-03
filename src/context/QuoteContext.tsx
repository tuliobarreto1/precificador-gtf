
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { QuoteFormData, SavedQuote, QuoteContextType, QuoteCalculationResult } from './types/quoteTypes';
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
    protectionPlanId: null, // Adicionado campo de proteção
  },
};

// Criar o contexto
const QuoteContext = createContext<QuoteContextType>({} as QuoteContextType);

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
    canDeleteQuote
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
    setGlobalProtectionPlanId, // Novo método
    setUseGlobalParams,
    setClient,
    resetForm
  } = useQuoteParams(quoteForm, setQuoteForm);
  
  const {
    calculateQuote,
    sendQuoteByEmail
  } = useQuoteCalculation(quoteForm);
  
  const {
    savedQuotes,
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
    setGlobalProtectionPlanId, // Novo método
    setUseGlobalParams,
    setVehicleParams,
    resetForm,
    calculateQuote: () => {
      const result = calculateQuote();
      if (result instanceof Promise) {
        return null;
      }
      return result;
    },
    saveQuote: () => {
      const result = saveQuote();
      if (result instanceof Promise) {
        return false;
      }
      return result;
    },
    getCurrentUser,
    setCurrentUser,
    availableUsers,
    isEditMode,
    currentEditingQuoteId,
    getClientById: getClient,
    getVehicleById: getVehicle,
    loadQuoteForEditing: (quoteId: string) => {
      const result = loadQuoteForEditing(quoteId);
      if (result instanceof Promise) {
        return false;
      }
      return result;
    },
    deleteQuote,
    canEditQuote: (quoteId: string) => {
      const quote = savedQuotes.find(q => q.id === quoteId);
      if (!quote) return false;
      return canEditQuote(quote);
    },
    canDeleteQuote: (quoteId: string) => {
      const quote = savedQuotes.find(q => q.id === quoteId);
      if (!quote) return false;
      return canDeleteQuote(quote);
    },
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
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};
