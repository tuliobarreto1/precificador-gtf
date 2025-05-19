import { useState } from 'react';
import { QuoteFormData, QuoteCalculationResult, QuoteResultVehicle } from '@/context/types/quoteTypes';
import { useBasicCalculations } from './calculation/useBasicCalculations';
import { useProtectionCalculation } from './calculation/useProtectionCalculation';
import { useTaxIndices } from './useTaxIndices';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const basicCalculations = useBasicCalculations();
  const protectionCalculation = useProtectionCalculation();
  const taxIndices = useTaxIndices();

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
        
        // Garantir que operationSeverity seja um valor válido (1-6)
        const safeOperationSeverity = ensureSeverityValue(params.operationSeverity);
        
        // Calcular custo de depreciação com a nova fórmula
        const totalDepreciation = basicCalculations.calculateDepreciation(
          item.vehicle.value, 
          params.monthlyKm,
          safeOperationSeverity,
          params.contractMonths
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
        let ipvaCost = 0;
        if (params.includeIpva) {
          ipvaCost = (item.vehicle.value * taxIndices.ipvaRate) / 12;
          console.log(`IPVA calculado para veículo ${item.vehicle.id}:`, {
            valorVeiculo: item.vehicle.value,
            taxaIPVA: taxIndices.ipvaRate,
            custoIPVAAnual: item.vehicle.value * taxIndices.ipvaRate,
            custoIPVAMensal: ipvaCost
          });
        }
        
        let licensingCost = 0;
        if (params.includeLicensing) {
          licensingCost = taxIndices.licensingFee / 12;
          console.log(`Licenciamento calculado para veículo ${item.vehicle.id}:`, {
            taxaLicenciamento: taxIndices.licensingFee,
            custoLicenciamentoMensal: licensingCost
          });
        }
        
        // Cálculo de impostos
        let taxCost = 0;
        if (params.includeTaxes) {
          taxCost = taxIndices.calculateTaxCost(item.vehicle.value, params.contractMonths);
          console.log(`Custo financeiro calculado para veículo ${item.vehicle.brand} ${item.vehicle.model}:`, {
            vehicleValue: item.vehicle.value,
            contractMonths: params.contractMonths,
            taxCost,
            includeTaxes: params.includeTaxes,
            taxBreakdown: taxIndices.getTaxBreakdown(item.vehicle.value, params.contractMonths)
          });
        }
        
        // Custo total mensal incluindo impostos
        const totalCost = totalDepreciation + maintenanceCost + trackingCost + 
                         protectionCost + ipvaCost + licensingCost + taxCost;
        
        console.log(`Resumo para veículo ${item.vehicle.brand} ${item.vehicle.model}:`, {
          depreciation: totalDepreciation.toFixed(2),
          maintenance: maintenanceCost.toFixed(2),
          tracking: trackingCost.toFixed(2),
          protection: protectionCost.toFixed(2),
          ipva: ipvaCost.toFixed(2),
          licensing: licensingCost.toFixed(2),
          taxes: taxCost.toFixed(2),
          total: totalCost.toFixed(2),
          protectionPlanId: params.protectionPlanId,
          includeIpva: params.includeIpva,
          includeLicensing: params.includeLicensing,
          includeTaxes: params.includeTaxes,
          contractMonths: params.contractMonths,
          monthlyKm: params.monthlyKm
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
          licensingCost,
          taxCost,
          includeIpva: params.includeIpva,
          includeLicensing: params.includeLicensing,
          includeTaxes: params.includeTaxes,
          contractMonths: params.contractMonths,
          monthlyKm: params.monthlyKm
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
  
  // Função auxiliar para garantir que operationSeverity seja um valor válido (1-6)
  const ensureSeverityValue = (value: number): 1|2|3|4|5|6 => {
    if (value >= 1 && value <= 6) {
      return value as 1|2|3|4|5|6;
    }
    return 3; // Valor padrão seguro
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
        
        // Garantir que operationSeverity seja um valor válido (1-6)
        const safeOperationSeverity = ensureSeverityValue(params.operationSeverity);
        
        // Calcular custo de depreciação
        const totalDepreciation = basicCalculations.calculateDepreciation(
          item.vehicle.value, 
          params.monthlyKm,
          safeOperationSeverity,
          params.contractMonths
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
        const protectionCost = 0; // Valor temporário, será substituído na versão assíncrona
        
        // Custos de IPVA e Licenciamento
        let ipvaCost = 0;
        if (params.includeIpva) {
          ipvaCost = (item.vehicle.value * taxIndices.ipvaRate) / 12;
          console.log(`IPVA calculado (síncrono) para veículo ${item.vehicle.id}:`, {
            valorVeiculo: item.vehicle.value,
            taxaIPVA: taxIndices.ipvaRate,
            custoIPVAAnual: item.vehicle.value * taxIndices.ipvaRate,
            custoIPVAMensal: ipvaCost
          });
        }
        
        let licensingCost = 0;
        if (params.includeLicensing) {
          licensingCost = taxIndices.licensingFee / 12;
          console.log(`Licenciamento calculado (síncrono) para veículo ${item.vehicle.id}:`, {
            taxaLicenciamento: taxIndices.licensingFee,
            custoLicenciamentoMensal: licensingCost
          });
        }
        
        // Cálculo de impostos (versão síncrona)
        let taxCost = 0;
        if (params.includeTaxes) {
          const taxBreakdown = taxIndices.getTaxBreakdown(item.vehicle.value, params.contractMonths);
          taxCost = taxBreakdown.monthlyCost;
          
          console.log(`Cálculo síncrono para veículo ${item.vehicle.brand} ${item.vehicle.model}:`, {
            vehicleValue: item.vehicle.value,
            contractMonths: params.contractMonths,
            taxes: {
              includeTaxes: params.includeTaxes,
              taxCost,
              taxBreakdown
            }
          });
        }
        
        // Custo total mensal incluindo impostos
        const totalCost = totalDepreciation + maintenanceCost + trackingCost + 
                       protectionCost + ipvaCost + licensingCost + taxCost;
        
        console.log(`Resumo síncrono para veículo ${item.vehicle.brand} ${item.vehicle.model}:`, {
          depreciation: totalDepreciation.toFixed(2),
          maintenance: maintenanceCost.toFixed(2), 
          ipva: ipvaCost.toFixed(2),
          licensing: licensingCost.toFixed(2),
          taxes: taxCost.toFixed(2),
          total: totalCost.toFixed(2),
          includeIpva: params.includeIpva,
          includeLicensing: params.includeLicensing,
          includeTaxes: params.includeTaxes
        });
        
        vehicleResults.push({
          vehicleId: item.vehicle.id,
          totalCost,
          depreciationCost: totalDepreciation,
          maintenanceCost,
          extraKmRate,
          protectionCost,
          protectionPlanId: params.protectionPlanId,
          ipvaCost,
          licensingCost,
          taxCost,
          includeIpva: params.includeIpva,
          includeLicensing: params.includeLicensing,
          includeTaxes: params.includeTaxes,
          contractMonths: params.contractMonths,
          monthlyKm: params.monthlyKm
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
  const sendQuoteByEmail = async (
    quoteId: string, 
    email: string, 
    message?: string,
    discountJustifications?: {[vehicleId: string]: {reason: string, authorizedBy: string}}
  ): Promise<boolean> => {
    try {
      // Esta função seria integrada com o backend para envio de e-mails
      console.log(`Enviando orçamento ${quoteId} para ${email}`, { 
        message,
        discountJustifications: discountJustifications ? JSON.stringify(discountJustifications) : 'Sem justificativas'
      });
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
