
import { QuoteFormData, VehicleQuoteResult } from '@/context/types/quoteTypes';
import { DepreciationParams, MaintenanceParams, calculateLeaseCostSync, calculateExtraKmRateSync } from '@/lib/calculation';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  // Calculate quote
  const calculateQuote = () => {
    const { vehicles, globalParams, useGlobalParams } = quoteForm;
    
    if (vehicles.length === 0) return null;
    
    // Precisamos garantir que não retornamos Promises para os cálculos
    const vehicleResults: VehicleQuoteResult[] = [];
    
    for (const item of vehicles) {
      // Usar parâmetros globais ou específicos do veículo
      const params = useGlobalParams ? globalParams : (item.params || globalParams);
      
      const depreciationParams: DepreciationParams = {
        vehicleValue: item.vehicle.value,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        operationSeverity: params.operationSeverity,
      };
      
      const maintenanceParams: MaintenanceParams = {
        vehicleGroup: item.vehicleGroup.id,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        hasTracking: params.hasTracking,
      };
    
      // Calculamos de forma síncrona para evitar Promises
      const result = calculateLeaseCostSync(depreciationParams, maintenanceParams);
      const extraKmRate = calculateExtraKmRateSync(item.vehicle.value);
    
      // Construímos um objeto VehicleQuoteResult completo
      vehicleResults.push({
        vehicleId: item.vehicle.id,
        depreciationCost: result.depreciationCost,
        maintenanceCost: result.maintenanceCost,
        trackingCost: result.trackingCost,
        totalCost: result.totalCost,
        costPerKm: result.costPerKm,
        extraKmRate
      });
    }
    
    // Calcular custo total de todos os veículos
    const totalCost = vehicleResults.reduce((sum, result) => sum + result.totalCost, 0);
    
    return {
      vehicleResults,
      totalCost
    };
  };

  // Função para enviar orçamento por e-mail (para ser implementada)
  const sendQuoteByEmail = async (quoteId: string, email: string, message: string): Promise<boolean> => {
    // Simulação de envio de e-mail
    console.log('Enviando orçamento por e-mail:', { quoteId, email, message });
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('E-mail enviado com sucesso!');
        resolve(true);
      }, 2000);
    });
  };

  return {
    calculateQuote,
    sendQuoteByEmail
  };
}
