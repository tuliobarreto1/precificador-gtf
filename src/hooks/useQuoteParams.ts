import { QuoteFormData, VehicleParams } from '@/context/types/quoteTypes';
import { Client } from '@/lib/models';
import { Dispatch, SetStateAction } from 'react';

export function useQuoteParams(
  quoteForm: QuoteFormData,
  setQuoteForm: Dispatch<SetStateAction<QuoteFormData>>
) {
  // Cliente
  const setClient = (client: Client | null) => {
    setQuoteForm(prev => ({
      ...prev,
      client
    }));
  };

  // Parâmetros globais
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

  const setGlobalProtectionPlanId = (protectionPlanId: string | null) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        protectionPlanId
      }
    }));
  };

  // Métodos para IPVA e Licenciamento
  const setGlobalIncludeIpva = (includeIpva: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        includeIpva
      }
    }));
  };

  const setGlobalIncludeLicensing = (includeLicensing: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        includeLicensing
      }
    }));
  };
  
  // Novo método para incluir impostos
  const setGlobalIncludeTaxes = (includeTaxes: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: {
        ...prev.globalParams,
        includeTaxes
      }
    }));
  };

  // Controle global/individual
  const setUseGlobalParams = (useGlobalParams: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      useGlobalParams
    }));
  };

  // Reset
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
        protectionPlanId: null,
        includeIpva: false,
        includeLicensing: false,
        includeTaxes: false, // Novo campo inicializado como false
      }
    });
  };

  return {
    setClient,
    setGlobalContractMonths,
    setGlobalMonthlyKm,
    setGlobalOperationSeverity,
    setGlobalHasTracking,
    setGlobalProtectionPlanId,
    setGlobalIncludeIpva,
    setGlobalIncludeLicensing,
    setGlobalIncludeTaxes, // Novo método
    setUseGlobalParams,
    resetForm
  };
}
