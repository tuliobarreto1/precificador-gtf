
import { useState } from 'react';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';

/**
 * Hook para lidar com cálculos relacionados a planos de proteção
 */
export function useProtectionCalculation() {
  const [protectionError, setProtectionError] = useState<string | null>(null);
  
  /**
   * Busca e calcula o custo de proteção para um plano específico
   */
  const calculateProtectionCost = async (protectionPlanId: string | null): Promise<number> => {
    if (!protectionPlanId) return 0;
    
    try {
      const planDetails = await fetchProtectionPlanDetails(protectionPlanId);
      if (planDetails) {
        return planDetails.monthly_cost;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao buscar detalhes do plano de proteção:', error);
      setProtectionError('Falha ao calcular custo de proteção');
      return 0;
    }
  };
  
  /**
   * Versão síncrona do cálculo de proteção (retorna sempre 0)
   */
  const getProtectionCostSync = (protectionPlanId: string | null): number => {
    // Na versão síncrona, não conseguimos buscar o custo real
    return 0;
  };
  
  return {
    calculateProtectionCost,
    getProtectionCostSync,
    protectionError
  };
}
