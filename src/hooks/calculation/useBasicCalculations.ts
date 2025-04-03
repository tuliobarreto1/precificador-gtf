
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
    const depreciationRate = 0.015; // Taxa base
    const mileageMultiplier = 0.05; // Influência da quilometragem
    const severityMultiplier = 0.1; // Influência da severidade
    
    const mileageFactor = monthlyKm / 1000 * mileageMultiplier;
    const severityFactor = (operationSeverity - 1) * severityMultiplier;
    
    const monthlyDepreciationRate = depreciationRate + mileageFactor + severityFactor;
    return vehicleValue * monthlyDepreciationRate;
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
    const revisionCostPerMonth = (monthlyKm / revisionKm) * revisionCost;
    const tireCostPerMonth = (monthlyKm / tireKm) * tireCost;
    return revisionCostPerMonth + tireCostPerMonth;
  };
  
  /**
   * Calcula a taxa para quilometragem excedente
   */
  const calculateExtraKmRate = (vehicleValue: number): number => {
    return vehicleValue * 0.0000075;
  };
  
  /**
   * Calcula o custo de rastreamento
   */
  const calculateTrackingCost = (hasTracking: boolean): number => {
    return hasTracking ? 50 : 0;
  };
  
  return {
    calculateDepreciation,
    calculateMaintenanceCost,
    calculateExtraKmRate,
    calculateTrackingCost
  };
}
