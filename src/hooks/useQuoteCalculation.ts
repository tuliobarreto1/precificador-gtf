
import { useState } from 'react';
import { QuoteFormData, VehicleQuoteResult } from '../context/types/quoteTypes';
import { calculateLeaseCostSync } from '../lib/calculation';
import { supabase } from '@/integrations/supabase/client';

export function useQuoteCalculation(quoteForm: QuoteFormData) {
  const [sendingEmail, setSendingEmail] = useState(false);

  // Função para calcular o orçamento
  const calculateQuote = () => {
    if (quoteForm.vehicles.length === 0) {
      return null;
    }

    const vehicleResults: VehicleQuoteResult[] = [];
    let totalCost = 0;

    for (const item of quoteForm.vehicles) {
      const params = quoteForm.useGlobalParams
        ? quoteForm.globalParams
        : item.params || quoteForm.globalParams;

      // Usando calculateLeaseCostSync ao invés de calculateVehicleCosts
      const result = calculateLeaseCostSync(
        {
          vehicleValue: item.vehicle.value,
          contractMonths: params.contractMonths,
          monthlyKm: params.monthlyKm,
          operationSeverity: params.operationSeverity
        },
        {
          vehicleGroup: item.vehicleGroup.id,
          contractMonths: params.contractMonths,
          monthlyKm: params.monthlyKm,
          hasTracking: params.hasTracking
        }
      );

      // Calcular a taxa de KM extra usando o valor do veículo
      const extraKmRate = result.costPerKm * 1.5; // Ajuste conforme necessário

      vehicleResults.push({
        vehicleId: item.vehicle.id,
        depreciationCost: result.depreciationCost,
        maintenanceCost: result.maintenanceCost,
        trackingCost: result.trackingCost,
        totalCost: result.totalCost,
        costPerKm: result.costPerKm,
        extraKmRate: extraKmRate
      });

      totalCost += result.totalCost;
    }

    return {
      vehicleResults,
      totalCost
    };
  };

  // Função para enviar orçamento por e-mail
  const sendQuoteByEmail = async (quoteId: string, recipientEmail: string, message: string): Promise<boolean> => {
    try {
      setSendingEmail(true);
      console.log("Enviando orçamento por e-mail:", { quoteId, recipientEmail, message });

      // Buscar os dados do orçamento para envio
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          client_id,
          monthly_values,
          contract_months,
          monthly_km,
          clients(name, email),
          quote_vehicles(
            id,
            vehicle_id,
            monthly_value,
            vehicles(brand, model, plate_number)
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        console.error("Erro ao buscar dados do orçamento:", quoteError);
        return false;
      }

      // Buscar informações do usuário atual
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        console.error("Usuário não autenticado");
        return false;
      }

      // Ajuste da consulta do perfil do usuário para verificar os campos disponíveis
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
      }

      // Verificar se userData é válido antes de acessar suas propriedades
      const senderName = userData?.name || 'Consultor de Frotas';
      const senderEmail = userData?.email || '';
      const senderPhone = ''; // Campo removido já que não existe na tabela profiles

      // Preparar dados para envio
      const vehicles = quote.quote_vehicles?.map((qv) => ({
        brand: qv.vehicles?.brand || '',
        model: qv.vehicles?.model || '',
        plateNumber: qv.vehicles?.plate_number || '',
        monthlyValue: qv.monthly_value || 0
      })) || [];

      // Chamar a função Edge do Supabase para envio do e-mail
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          quoteId: quote.id,
          quoteTitle: quote.title || 'Orçamento de Frota',
          recipientEmail,
          recipientName: quote.clients?.name || '',
          message,
          totalValue: quote.monthly_values || 0,
          contractMonths: quote.contract_months || 24,
          monthlyKm: quote.monthly_km || 3000,
          vehicles,
          senderName,
          senderEmail,
          senderPhone
        }
      });

      if (error) {
        console.error("Erro ao enviar e-mail:", error);
        return false;
      }

      console.log("E-mail enviado com sucesso:", data);
      return true;
    } catch (err) {
      console.error("Erro ao processar envio de e-mail:", err);
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
