
import { QuoteParams, QuoteVehicleItem, QuoteResultVehicle } from '@/context/types/quoteTypes';

/**
 * Hook utilitário para funções básicas de cálculo
 */
export function useBasicCalculations() {
  /**
   * Calcula o custo de depreciação para um veículo
   */
  const calculateDepreciation = (
    vehicleValue: number, 
    monthlyKm: number, 
    operationSeverity: 1|2|3|4|5|6
  ): number => {
    // Taxa base mensal de depreciação (reduzida significativamente)
    const depreciationRate = 0.0015; 
    
    // Fatores de ajuste para quilometragem e severidade
    const mileageMultiplier = 0.0005; // Reduzido
    const severityMultiplier = 0.001; // Reduzido
    
    // Ajustes baseados na quilometragem mensal e severidade de operação
    const mileageFactor = (monthlyKm / 1000) * mileageMultiplier;
    const severityFactor = (operationSeverity - 1) * severityMultiplier;
    
    // Taxa final de depreciação mensal (%)
    const monthlyDepreciationRate = depreciationRate + mileageFactor + severityFactor;
    
    // Valor da depreciação mensal
    const monthlyDepreciation = vehicleValue * monthlyDepreciationRate;
    console.log(`Cálculo de depreciação: Valor do veículo: R$ ${vehicleValue}, Taxa: ${(monthlyDepreciationRate*100).toFixed(4)}%, Depreciação mensal: R$ ${monthlyDepreciation.toFixed(2)}`);
    
    return monthlyDepreciation;
  };
  
  /**
   * Calcula os custos de manutenção para um veículo
   */
  const calculateMaintenanceCost = (
    monthlyKm: number,
    revisionKm: number,
    revisionCost: number,
    tireKm: number,
    tireCost: number
  ): number => {
    // Cálculo dos custos mensais baseados na quilometragem
    const revisionCostPerMonth = (monthlyKm / revisionKm) * revisionCost;
    const tireCostPerMonth = (monthlyKm / tireKm) * tireCost;
    
    const totalMaintenanceCost = revisionCostPerMonth + tireCostPerMonth;
    console.log(`Cálculo de manutenção: Revisões: R$ ${revisionCostPerMonth.toFixed(2)}, Pneus: R$ ${tireCostPerMonth.toFixed(2)}, Total: R$ ${totalMaintenanceCost.toFixed(2)}`);
    
    return totalMaintenanceCost;
  };
  
  /**
   * Calcula a taxa para quilometragem excedente
   */
  const calculateExtraKmRate = (vehicleValue: number): number => {
    // Taxa por km excedente (reduzida)
    const rate = 0.0000075;
    const extraKmRate = vehicleValue * rate;
    
    console.log(`Taxa de km excedente: R$ ${extraKmRate.toFixed(2)} por km`);
    return extraKmRate;
  };
  
  /**
   * Calcula o custo de rastreamento
   */
  const calculateTrackingCost = (hasTracking: boolean): number => {
    const trackingCost = hasTracking ? 50 : 0;
    console.log(`Custo do rastreamento: R$ ${trackingCost.toFixed(2)}`);
    return trackingCost;
  };
  
  return {
    calculateDepreciation,
    calculateMaintenanceCost,
    calculateExtraKmRate,
    calculateTrackingCost
  };
}
