
import { useState } from 'react';
import { QuoteFormData, QuoteCalculationResult, QuoteResultVehicle } from '@/context/types/quoteTypes';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  const [calculationError, setCalculationError] = useState<string | null>(null);

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
        const depreciationRate = 0.015; // Taxa base
        const mileageMultiplier = 0.05; // Influência da quilometragem
        const severityMultiplier = 0.1; // Influência da severidade
        
        const mileageFactor = params.monthlyKm / 1000 * mileageMultiplier;
        const severityFactor = (params.operationSeverity - 1) * severityMultiplier;
        
        const monthlyDepreciationRate = depreciationRate + mileageFactor + severityFactor;
        const totalDepreciation = item.vehicle.value * monthlyDepreciationRate;
        
        // Calcular custo de manutenção
        const monthlyKm = params.monthlyKm;
        const revisionCost = (monthlyKm / item.vehicleGroup.revisionKm) * item.vehicleGroup.revisionCost;
        const tireCost = (monthlyKm / item.vehicleGroup.tireKm) * item.vehicleGroup.tireCost;
        const maintenanceCost = revisionCost + tireCost;
        
        // Taxa para km excedente
        const extraKmRate = item.vehicle.value * 0.0000075;
        
        // Custo de rastreamento
        const trackingCost = params.hasTracking ? 50 : 0;
        
        // Custo da proteção
        let protectionCost = 0;
        let protectionPlanId = params.protectionPlanId;
        
        if (protectionPlanId) {
          try {
            const planDetails = await fetchProtectionPlanDetails(protectionPlanId);
            if (planDetails) {
              protectionCost = planDetails.monthly_cost;
            }
          } catch (error) {
            console.error('Erro ao buscar detalhes do plano de proteção:', error);
          }
        }
        
        // Custo total mensal
        const totalCost = totalDepreciation + maintenanceCost + trackingCost + protectionCost;
        
        return {
          vehicleId: item.vehicle.id,
          totalCost,
          depreciationCost: totalDepreciation,
          maintenanceCost,
          extraKmRate,
          protectionCost,
          protectionPlanId
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
  
  // Função para enviar orçamento por email
  const sendQuoteByEmail = async (quoteId: string, email: string, message?: string): Promise<boolean> => {
    // Manter implementação existente
    return true;
  };

  return {
    calculateQuote,
    calculationError,
    sendQuoteByEmail
  };
}
