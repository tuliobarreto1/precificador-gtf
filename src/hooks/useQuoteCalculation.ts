
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuoteFormData, VehicleQuoteResult } from '@/context/types/quoteTypes';
import { calculateDepreciationSync, calculateMaintenanceSync, getGlobalParamsSync } from '@/lib/calculation';
import { useToast } from './use-toast';
import { useQuoteUsers } from './useQuoteUsers';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();
  const { getCurrentUser } = useQuoteUsers();

  // Calcular orçamento para todos os veículos
  const calculateQuote = () => {
    if (quoteForm.vehicles.length === 0 || !quoteForm.client) return null;

    let vehicleResults: VehicleQuoteResult[] = [];
    let totalCost = 0;

    // Obter o custo de rastreamento dos parâmetros globais
    const globalParams = getGlobalParamsSync();
    const trackingCost = globalParams.trackingCost;

    // Calcular para cada veículo
    quoteForm.vehicles.forEach(item => {
      // Usar parâmetros individuais ou globais conforme a configuração
      const params = item.params && !quoteForm.useGlobalParams
        ? item.params
        : quoteForm.globalParams;

      // Calcular custos
      const depreciationCost = calculateDepreciationSync({
        vehicleValue: item.vehicle.value,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        operationSeverity: params.operationSeverity
      });

      const maintenanceCost = calculateMaintenanceSync({
        vehicleGroup: item.vehicleGroup.id,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        hasTracking: params.hasTracking
      });

      // Determinar o custo de rastreamento
      const currentTrackingCost = params.hasTracking ? trackingCost : 0;

      const totalVehicleCost = depreciationCost + maintenanceCost;
      
      // Taxa KM excedente (20% a mais que o custo por KM)
      const costPerKm = totalVehicleCost / (params.monthlyKm * params.contractMonths);
      const extraKmRate = costPerKm * 1.2;

      // Adicionar resultado deste veículo
      vehicleResults.push({
        vehicleId: item.vehicle.id,
        depreciationCost,
        maintenanceCost,
        trackingCost: currentTrackingCost,
        totalCost: totalVehicleCost,
        costPerKm,
        extraKmRate
      });

      totalCost += totalVehicleCost;
    });

    return { vehicleResults, totalCost };
  };

  // Função para enviar orçamento por email
  const sendQuoteByEmail = async (quoteId: string, email: string, message: string): Promise<boolean> => {
    setSendingEmail(true);
    
    try {
      console.log('Enviando orçamento por email:', { quoteId, email, message });
      
      // Buscar detalhes do orçamento
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          contract_months,
          monthly_km,
          total_value,
          client_id,
          clients(name),
          quote_vehicles(
            id,
            monthly_value,
            vehicle_id,
            vehicles(brand, model, plate_number)
          )
        `)
        .eq('id', quoteId)
        .single();
      
      if (quoteError) {
        console.error('Erro ao buscar detalhes do orçamento:', quoteError);
        toast({
          title: 'Erro ao enviar email',
          description: 'Não foi possível carregar os detalhes do orçamento.',
          variant: 'destructive'
        });
        return false;
      }
      
      const currentUser = getCurrentUser();
      
      // Preparar dados para a função do Supabase Edge
      const emailData = {
        quoteId: quoteData.id,
        quoteTitle: quoteData.title,
        recipientEmail: email,
        message: message,
        contractMonths: quoteData.contract_months,
        monthlyKm: quoteData.monthly_km,
        totalValue: quoteData.total_value,
        recipientName: quoteData.clients?.name,
        vehicles: (quoteData.quote_vehicles || []).map((qv: any) => ({
          brand: qv.vehicles?.brand || '',
          model: qv.vehicles?.model || '',
          plateNumber: qv.vehicles?.plate_number,
          monthlyValue: qv.monthly_value
        })),
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        senderPhone: '(XX) XXXX-XXXX' // Substituir por telefone real quando disponível
      };
      
      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: emailData
      });
      
      if (error) {
        console.error('Erro ao enviar email:', error);
        toast({
          title: 'Erro ao enviar email',
          description: error.message || 'Ocorreu um erro ao enviar o email.',
          variant: 'destructive'
        });
        return false;
      }
      
      console.log('Email enviado com sucesso:', data);
      return true;
      
    } catch (error: any) {
      console.error('Exceção ao enviar email:', error);
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Ocorreu um erro inesperado ao enviar o email.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  return {
    calculateQuote,
    sendQuoteByEmail,
    sendingEmail
  };
}
