
import { useState } from 'react';
import { QuoteFormData, QuoteCalculationResult, QuoteResultVehicle } from '@/context/types/quoteTypes';
import { useBasicCalculations } from './calculation/useBasicCalculations';
import { useProtectionCalculation } from './calculation/useProtectionCalculation';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const basicCalculations = useBasicCalculations();
  const protectionCalculation = useProtectionCalculation();

  const calculateQuote = async (): Promise<QuoteCalculationResult | null> => {
    setCalculationError(null);
    
    try {
      if (!quoteForm.client || quoteForm.vehicles.length === 0) {
        setCalculationError("Dados insuficientes para calcular orçamento");
        return null;
      }
      
      // Calcular resultados para cada veículo com proteção
      const vehicleResultsPromises = quoteForm.vehicles.map(async item => {
        // Determinar parâmetros a serem usados
        const params = quoteForm.useGlobalParams ? quoteForm.globalParams : item.params || quoteForm.globalParams;
        
        // Calcular custo de depreciação
        const totalDepreciation = basicCalculations.calculateDepreciation(
          item.vehicle.value, 
          params.monthlyKm,
          params.operationSeverity
        );
        
        // Calcular custo de manutenção
        const maintenanceCost = basicCalculations.calculateMaintenanceCost(
          params.monthlyKm,
          item.vehicleGroup.revisionKm,
          item.vehicleGroup.revisionCost,
          item.vehicleGroup.tireKm,
          item.vehicleGroup.tireCost
        );
        
        // Taxa para km excedente
        const extraKmRate = basicCalculations.calculateExtraKmRate(item.vehicle.value);
        
        // Custo de rastreamento
        const trackingCost = basicCalculations.calculateTrackingCost(params.hasTracking);
        
        // Custo da proteção - garantir que seja buscado do servidor
        const protectionCost = await protectionCalculation.calculateProtectionCost(params.protectionPlanId);
        
        // Custos de IPVA e Licenciamento
        const ipvaCost = params.includeIpva ? (item.vehicleGroup.ipvaCost || 0) / 12 : 0;
        const licensingCost = params.includeLicensing ? (item.vehicleGroup.licensingCost || 0) / 12 : 0;
        
        // Custo total mensal
        const totalCost = totalDepreciation + maintenanceCost + trackingCost + protectionCost + ipvaCost + licensingCost;
        
        console.log(`Resumo para veículo ${item.vehicle.brand} ${item.vehicle.model}:`, {
          depreciation: totalDepreciation.toFixed(2),
          maintenance: maintenanceCost.toFixed(2),
          tracking: trackingCost.toFixed(2),
          protection: protectionCost.toFixed(2),
          ipva: ipvaCost.toFixed(2),
          licensing: licensingCost.toFixed(2),
          total: totalCost.toFixed(2),
          protectionPlanId: params.protectionPlanId,
          includeIpva: params.includeIpva,
          includeLicensing: params.includeLicensing
        });
        
        return {
          vehicleId: item.vehicle.id,
          totalCost,
          depreciationCost: totalDepreciation,
          maintenanceCost,
          extraKmRate,
          protectionCost,
          protectionPlanId: params.protectionPlanId,
          ipvaCost,
          licensingCost
        };
      });
      
      const vehicleResults = await Promise.all(vehicleResultsPromises);
      
      // Calcular custo total combinado
      const totalCost = vehicleResults.reduce((sum, vehicle) => sum + vehicle.totalCost, 0);
      
      return {
        vehicleResults,
        totalCost
      };
      
    } catch (error) {
      console.error("Erro ao calcular orçamento:", error);
      setCalculationError("Ocorreu um erro ao calcular o orçamento");
      return null;
    }
  };
  
  // Versão síncrona do cálculo para uso no contexto
  const calculateQuoteSync = (): QuoteCalculationResult | null => {
    try {
      if (!quoteForm.client || quoteForm.vehicles.length === 0) {
        setCalculationError("Dados insuficientes para calcular orçamento");
        return null;
      }
      
      // Array para armazenar resultados dos veículos
      const vehicleResults: QuoteResultVehicle[] = [];
      
      // Calcular resultados para cada veículo sem proteção (versão síncrona)
      quoteForm.vehicles.forEach(item => {
        // Determinar parâmetros a serem usados
        const params = quoteForm.useGlobalParams ? quoteForm.globalParams : item.params || quoteForm.globalParams;
        
        // Calcular custo de depreciação
        const totalDepreciation = basicCalculations.calculateDepreciation(
          item.vehicle.value, 
          params.monthlyKm,
          params.operationSeverity
        );
        
        // Calcular custo de manutenção
        const maintenanceCost = basicCalculations.calculateMaintenanceCost(
          params.monthlyKm,
          item.vehicleGroup.revisionKm,
          item.vehicleGroup.revisionCost,
          item.vehicleGroup.tireKm,
          item.vehicleGroup.tireCost
        );
        
        // Taxa para km excedente
        const extraKmRate = basicCalculations.calculateExtraKmRate(item.vehicle.value);
        
        // Custo de rastreamento
        const trackingCost = basicCalculations.calculateTrackingCost(params.hasTracking);
        
        // Para cálculo síncrono, usamos um valor fallback para proteção
        // Na versão assíncrona, buscamos do servidor
        const protectionCost = 0; // Valor temporário, será substituído na versão assíncrona
        
        // Custos de IPVA e Licenciamento
        const ipvaCost = params.includeIpva ? (item.vehicleGroup.ipvaCost || 0) / 12 : 0;
        const licensingCost = params.includeLicensing ? (item.vehicleGroup.licensingCost || 0) / 12 : 0;
        
        // Custo total mensal
        const totalCost = totalDepreciation + maintenanceCost + trackingCost + protectionCost + ipvaCost + licensingCost;
        
        vehicleResults.push({
          vehicleId: item.vehicle.id,
          totalCost,
          depreciationCost: totalDepreciation,
          maintenanceCost,
          extraKmRate,
          protectionCost,
          protectionPlanId: params.protectionPlanId,
          ipvaCost,
          licensingCost
        });
      });
      
      // Calcular custo total combinado
      const totalCost = vehicleResults.reduce((sum, vehicle) => sum + vehicle.totalCost, 0);
      
      return {
        vehicleResults,
        totalCost
      };
      
    } catch (error) {
      console.error("Erro ao calcular orçamento (síncrono):", error);
      setCalculationError("Ocorreu um erro ao calcular o orçamento");
      return null;
    }
  };
  
  // Função para enviar orçamento por e-mail
  const sendQuoteByEmail = async (quoteId: string, email: string, message?: string): Promise<boolean> => {
    try {
      // Esta função seria integrada com o backend para envio de e-mails
      console.log(`Enviando orçamento ${quoteId} para ${email}`, { message });
      return true;
    } catch (error) {
      console.error("Erro ao enviar orçamento por e-mail:", error);
      return false;
    }
  };

  return {
    calculateQuote,
    calculateQuoteSync,
    calculationError,
    sendQuoteByEmail
  };
}
