
import { QuoteFormData, QuoteParams } from '@/context/types/quoteTypes';
import { Client } from '@/lib/models';

export function useQuoteParams(quoteForm: QuoteFormData, setQuoteForm: React.Dispatch<React.SetStateAction<QuoteFormData>>) {
  
  const setGlobalContractMonths = (contractMonths: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        contractMonths
      }
    }));
  };

  const setGlobalMonthlyKm = (monthlyKm: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        monthlyKm
      }
    }));
  };

  const setGlobalOperationSeverity = (operationSeverity: 1|2|3|4|5|6) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        operationSeverity
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
  
  // Nova função para configurar o plano de proteção global
  const setGlobalProtectionPlanId = (protectionPlanId: string | null) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        protectionPlanId
      }
    }));
  };

  const setUseGlobalParams = (useGlobalParams: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      useGlobalParams
    }));
  };

  const setClient = (client: Client | null) => {
    setQuoteForm(prev => ({
      ...prev,
      client
    }));
  };

  const resetForm = () => {
    setQuoteForm({
      client: null,
      vehicles: [],
      useGlobalParams: true,
      globalParams: {
        contractMonths: 24,
        monthlyKm: 3000,
        operationSeverity: 3,
        hasTracking: false,
        protectionPlanId: null
      }
    });
  };

  return {
    setGlobalContractMonths,
    setGlobalMonthlyKm,
    setGlobalOperationSeverity,
    setGlobalHasTracking,
    setGlobalProtectionPlanId,
    setUseGlobalParams,
    setClient,
    resetForm
  };
}
