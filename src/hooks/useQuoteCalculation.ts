
import { QuoteFormData, VehicleQuoteResult } from '@/context/types/quoteTypes';
import { DepreciationParams, MaintenanceParams, calculateDepreciationSync, calculateMaintenanceSync, calculateExtraKmRateSync } from '@/lib/calculation';
import { useState, useEffect } from 'react';
import { fetchCalculationParams } from '@/lib/settings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/data-provider';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  // Estado para armazenar parâmetros de cálculo do banco de dados
  const [calculationParams, setCalculationParams] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

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
    try {
      console.log('📧 Iniciando envio de orçamento por e-mail:', { quoteId, email, message });
      setSendingEmail(true);
      
      // Obter informações do orçamento
      const { data: quoteData } = await supabase
        .from('quotes')
        .select(`
          *,
          client:client_id(*),
          vehicles:quote_vehicles(
            *,
            vehicle:vehicle_id(*)
          )
        `)
        .eq('id', quoteId)
        .single();
      
      if (!quoteData) {
        console.error('❌ Orçamento não encontrado:', quoteId);
        toast.error('Erro ao enviar e-mail: Orçamento não encontrado');
        return false;
      }
      
      // Obter informações do usuário atual
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        console.error('❌ Usuário não encontrado');
        toast.error('Erro ao enviar e-mail: Usuário não encontrado');
        return false;
      }
      
      // Preparar dados para a função edge
      const emailData = {
        quoteId,
        quoteTitle: quoteData.title,
        recipientEmail: email,
        recipientName: quoteData.client?.name,
        message: message,
        totalValue: quoteData.monthly_values || 0,
        contractMonths: quoteData.contract_months || 12,
        monthlyKm: quoteData.monthly_km || 2000,
        vehicles: (quoteData.vehicles || []).map((qv: any) => ({
          brand: qv.vehicle?.brand || '',
          model: qv.vehicle?.model || '',
          plateNumber: qv.vehicle?.plate_number,
          monthlyValue: qv.monthly_value || 0
        })),
        senderName: currentUser.name || currentUser.email,
        senderEmail: currentUser.email,
        senderPhone: currentUser.phone
      };
      
      console.log('📧 Dados preparados para envio:', emailData);
      
      // Chamar a função edge
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: emailData
      });
      
      if (error) {
        console.error('❌ Erro ao chamar função de envio de e-mail:', error);
        toast.error(`Erro ao enviar e-mail: ${error.message}`);
        return false;
      }
      
      console.log('✅ E-mail enviado com sucesso:', data);
      toast.success('E-mail enviado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao enviar e-mail:', error);
      toast.error(`Erro ao enviar e-mail: ${error.message}`);
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  return {
    calculateQuote,
    sendQuoteByEmail,
    loadingParams: loading,
    sendingEmail,
    usingDatabaseParams: !!calculationParams
  };
}
