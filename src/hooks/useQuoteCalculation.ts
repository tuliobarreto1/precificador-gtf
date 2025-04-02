
import { QuoteFormData, VehicleQuoteResult } from '@/context/types/quoteTypes';
import { DepreciationParams, MaintenanceParams, calculateDepreciationSync, calculateMaintenanceSync, calculateExtraKmRateSync } from '@/lib/calculation';
import { useState, useEffect } from 'react';
import { fetchCalculationParams } from '@/lib/settings';
import { toast } from 'sonner';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  // Estado para armazenar parâmetros de cálculo do banco de dados
  const [calculationParams, setCalculationParams] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Carregar parâmetros de cálculo do banco de dados ao iniciar
  useEffect(() => {
    async function loadCalculationParams() {
      try {
        setLoading(true);
        const params = await fetchCalculationParams();
        if (params) {
          console.log('✅ Parâmetros de cálculo carregados do banco de dados:', params);
          setCalculationParams(params);
        } else {
          console.warn('⚠️ Parâmetros de cálculo não encontrados no banco, usando valores padrão');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar parâmetros de cálculo:', error);
        toast.error('Erro ao carregar parâmetros de cálculo');
      } finally {
        setLoading(false);
      }
    }

    loadCalculationParams();
  }, []);

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

      // Verificar se temos parâmetros do banco de dados
      if (calculationParams) {
        console.log(`📊 Calculando custos para veículo ${item.vehicle.brand} ${item.vehicle.model} com parâmetros do banco`);
      } else {
        console.log(`📊 Calculando custos para veículo ${item.vehicle.brand} ${item.vehicle.model} com parâmetros padrão`);
      }
    
      // Calculamos de forma síncrona para evitar Promises
      const result = {
        depreciationCost: calculateDepreciationSync(depreciationParams),
        maintenanceCost: calculateMaintenanceSync(maintenanceParams),
        trackingCost: params.hasTracking ? (calculationParams?.tracking_cost || 50) : 0
      };
      
      const totalCost = result.depreciationCost + result.maintenanceCost;
      const costPerKm = totalCost / params.monthlyKm;
      const extraKmRate = calculateExtraKmRateSync(item.vehicle.value);
    
      // Construímos um objeto VehicleQuoteResult completo
      vehicleResults.push({
        vehicleId: item.vehicle.id,
        depreciationCost: result.depreciationCost,
        maintenanceCost: result.maintenanceCost - result.trackingCost,
        trackingCost: result.trackingCost,
        totalCost: totalCost,
        costPerKm: costPerKm,
        extraKmRate
      });
    }
    
    // Calcular custo total de todos os veículos
    const totalCost = vehicleResults.reduce((sum, result) => sum + result.totalCost, 0);
    
    return {
      vehicleResults,
      totalCost,
      isUsingDatabaseParams: !!calculationParams
    };
  };

  // Função para enviar orçamento por e-mail
  const sendQuoteByEmail = async (quoteId: string, email: string, message: string): Promise<boolean> => {
    // Simulação de envio de e-mail
    console.log('Enviando orçamento por e-mail:', { quoteId, email, message });
    
    // Aqui você poderia implementar a lógica real de envio de e-mail
    // usando uma API de e-mail ou uma função do Supabase Edge
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('E-mail enviado com sucesso!');
        toast.success('E-mail enviado com sucesso!');
        resolve(true);
      }, 2000);
    });
  };

  return {
    calculateQuote,
    sendQuoteByEmail,
    loadingParams: loading,
    usingDatabaseParams: !!calculationParams
  };
}
