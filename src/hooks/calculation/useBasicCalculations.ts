import { QuoteParams, QuoteVehicleItem, QuoteResultVehicle } from '@/context/types/quoteTypes';

/**
 * Hook utilitário para funções básicas de cálculo
 */
export function useBasicCalculations() {
  /**
   * Calcula o custo de depreciação para um veículo usando a fórmula mais avançada
   * baseada no prazo de contrato e severidade de operação
   */
  const calculateDepreciation = (
    vehicleValue: number, 
    monthlyKm: number, 
    operationSeverity: 1|2|3|4|5|6,
    contractMonths: number = 12
  ): number => {
    // Valor base da taxa de depreciação (0,35 ou 35%)
    const baseRate = 0.35;
    
    // Fator de ajuste baseado na diferença de prazo em relação a 12 meses
    const contractAdjustment = (contractMonths - 12) / 12;
    
    // Multiplicador de severidade conforme a fórmula da planilha
    let severityMultiplier = 0;
    switch(operationSeverity) {
      case 1: severityMultiplier = 0.05; break;
      case 2: severityMultiplier = 0.06; break;
      case 3: severityMultiplier = 0.08; break;
      case 4: severityMultiplier = 0.10; break;
      case 5: severityMultiplier = 0.12; break;
      case 6: severityMultiplier = 0.20; break;
      default: severityMultiplier = 0.05;
    }
    
    // Cálculo da taxa de depreciação conforme a fórmula da planilha
    // =0,35+(((H3-12)/12)*(0,05))*(B21=1)+(((H3-12)/12)*(0,06))*(B21=2)+...
    const depreciationRate = baseRate + (contractAdjustment * severityMultiplier);
    
    // Ajuste para taxa mensal (dividindo pelo número de meses do contrato)
    const monthlyDepreciationRate = depreciationRate / contractMonths;
    
    // Valor da depreciação mensal
    const monthlyDepreciation = vehicleValue * monthlyDepreciationRate;
    
    console.log(`Cálculo de depreciação avançado: 
      Valor do veículo: R$ ${vehicleValue.toFixed(2)}, 
      Prazo: ${contractMonths} meses, 
      Severidade: ${operationSeverity}, 
      Taxa total: ${(depreciationRate*100).toFixed(2)}%, 
      Taxa mensal: ${(monthlyDepreciationRate*100).toFixed(4)}%, 
      Depreciação mensal: R$ ${monthlyDepreciation.toFixed(2)}`);
    
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
