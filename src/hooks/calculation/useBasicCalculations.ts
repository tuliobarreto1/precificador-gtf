
import { QuoteParams, QuoteVehicleItem, QuoteResultVehicle } from '@/context/types/quoteTypes';
import { fetchCalculationParams, CalculationParams } from '@/lib/settings';
import { useState, useEffect } from 'react';

/**
 * Hook utilitário para funções básicas de cálculo
 */
export function useBasicCalculations() {
  // Estado para armazenar os parâmetros de cálculo
  const [calculationParams, setCalculationParams] = useState<CalculationParams | null>(null);

  // Carregar parâmetros ao inicializar
  useEffect(() => {
    const loadParams = async () => {
      try {
        const params = await fetchCalculationParams();
        if (params) {
          setCalculationParams(params);
          console.log("Parâmetros de cálculo carregados:", params);
        }
      } catch (error) {
        console.error("Erro ao carregar parâmetros de cálculo:", error);
      }
    };
    
    loadParams();
  }, []);

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
    // Valor base da taxa de depreciação (0,35 ou 35%) - usa parâmetro do banco se disponível
    const baseRate = calculationParams?.depreciation_base_rate || 0.35;
    
    // Fator de ajuste baseado na diferença de prazo em relação a 12 meses
    const contractAdjustment = (contractMonths - 12) / 12;
    
    // Multiplicador de severidade conforme a fórmula da planilha
    // Usa parâmetros do banco se disponíveis, ou valores padrão
    let severityMultiplier = 0;
    switch(operationSeverity) {
      case 1: severityMultiplier = calculationParams?.severity_multiplier_1 || 0.05; break;
      case 2: severityMultiplier = calculationParams?.severity_multiplier_2 || 0.06; break;
      case 3: severityMultiplier = calculationParams?.severity_multiplier_3 || 0.08; break;
      case 4: severityMultiplier = calculationParams?.severity_multiplier_4 || 0.10; break;
      case 5: severityMultiplier = calculationParams?.severity_multiplier_5 || 0.12; break;
      case 6: severityMultiplier = calculationParams?.severity_multiplier_6 || 0.20; break;
      default: severityMultiplier = calculationParams?.severity_multiplier_1 || 0.05;
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
      Taxa base: ${baseRate} (parâmetro: ${calculationParams?.depreciation_base_rate || 'não definido'}),
      Multiplicador severidade: ${severityMultiplier},
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
    // Taxa por km excedente - usa parâmetro do banco se disponível ou valor padrão
    const rate = calculationParams?.extra_km_percentage || 0.0000075;
    const extraKmRate = vehicleValue * rate;
    
    console.log(`Taxa de km excedente: R$ ${extraKmRate.toFixed(2)} por km (usando taxa: ${rate})`);
    return extraKmRate;
  };
  
  /**
   * Calcula o custo de rastreamento
   */
  const calculateTrackingCost = (hasTracking: boolean): number => {
    // Usa o valor de rastreamento dos parâmetros se disponível, ou valor padrão
    const trackingCostValue = calculationParams?.tracking_cost || 50;
    const trackingCost = hasTracking ? trackingCostValue : 0;
    
    console.log(`Custo do rastreamento: R$ ${trackingCost.toFixed(2)} (valor configurado: R$ ${trackingCostValue})`);
    return trackingCost;
  };
  
  /**
   * Verifica se os parâmetros de cálculo estão carregados
   */
  const isParamsLoaded = (): boolean => {
    return calculationParams !== null;
  };
  
  return {
    calculateDepreciation,
    calculateMaintenanceCost,
    calculateExtraKmRate,
    calculateTrackingCost,
    isParamsLoaded,
    calculationParams
  };
}
