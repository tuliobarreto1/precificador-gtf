
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { QuoteFormData, SavedQuote, QuoteContextType, QuoteCalculationResult, User, defaultUser } from './types/quoteTypes';
import { useQuoteUsers } from '@/hooks/useQuoteUsers';
import { useQuoteVehicles } from '@/hooks/useQuoteVehicles';
import { useQuoteParams } from '@/hooks/useQuoteParams';
import { useQuoteCalculation } from '@/hooks/useQuoteCalculation';
import { useQuoteSaving } from '@/hooks/useQuoteSaving';
import { useQuoteData } from '@/hooks/useQuoteData';
import { sendEmailWithOutlook } from '@/lib/email-service';
import { useToast } from '@/hooks/use-toast';

// Initial state com impostos habilitados por padrão
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
    includeIpva: true,      // IPVA habilitado por padrão
    includeLicensing: true, // Licenciamento habilitado por padrão
    includeTaxes: true,     // Custos financeiros habilitados por padrão
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

  // Implementação do método sendQuoteByEmail
  const sendQuoteByEmail = async (quoteId: string, email: string, message: string): Promise<boolean> => {
    try {
      console.log(`Enviando orçamento ${quoteId} por e-mail para ${email}`);
      
      // Buscar os detalhes do orçamento
      const { quote: quoteData, error: quoteError } = await import('@/integrations/supabase/services/quotes')
        .then(module => module.getQuoteByIdFromSupabase(quoteId));
        
      if (quoteError || !quoteData) {
        console.error("Erro ao buscar dados do orçamento:", quoteError);
        toast({
          title: "Erro ao enviar e-mail",
          description: "Não foi possível obter os detalhes do orçamento",
          variant: "destructive"
        });
        return false;
      }
      
      // Preparar o assunto do e-mail
      const clientName = quoteData.clientName || 'Cliente';
      const emailSubject = `Proposta de locação de veículos - ${clientName}`;
      
      // Preparar o conteúdo do e-mail
      const emailContent = message || 
        `Prezado cliente,\n\nSegue em anexo a proposta de locação de veículos conforme solicitado.\n\nAtenciosamente,\nEquipe comercial`;
      
      // Enviar e-mail utilizando o serviço de e-mail
      const emailSent = await sendEmailWithOutlook(
        email, 
        emailSubject, 
        emailContent
      );
      
      if (emailSent) {
        toast({
          title: "E-mail enviado",
          description: `Orçamento enviado com sucesso para ${email}`
        });
        return true;
      } else {
        toast({
          title: "Falha no envio",
          description: "Não foi possível enviar o e-mail. Verifique as configurações.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Ocorreu um erro inesperado ao tentar enviar o e-mail",
        variant: "destructive"
      });
      return false;
    }
  };

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
