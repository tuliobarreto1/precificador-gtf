
import { useState } from 'react';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';

/**
 * Hook para lidar com cálculos relacionados a planos de proteção
 */
export function useProtectionCalculation() {
  const [protectionError, setProtectionError] = useState<string | null>(null);
  const [protectionCostCache, setProtectionCostCache] = useState<Record<string, number>>({});
  
  /**
   * Busca e calcula o custo de proteção para um plano específico
   */
  const calculateProtectionCost = async (protectionPlanId: string | null): Promise<number> => {
    if (!protectionPlanId) return 0;
    
    // Verificar se já temos o custo em cache
    if (protectionCostCache[protectionPlanId]) {
      console.log(`Usando custo de proteção em cache para o plano ${protectionPlanId}: R$ ${protectionCostCache[protectionPlanId].toFixed(2)}`);
      return protectionCostCache[protectionPlanId];
    }
    
    try {
      const planDetails = await fetchProtectionPlanDetails(protectionPlanId);
      if (planDetails) {
        const cost = planDetails.monthly_cost || 0;
        console.log(`Custo de proteção para o plano ${protectionPlanId} (${planDetails.name}): R$ ${cost.toFixed(2)}`);
        
        // Atualizar o cache
        setProtectionCostCache(prev => ({
          ...prev,
          [protectionPlanId]: cost
        }));
        
        return cost;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao buscar detalhes do plano de proteção:', error);
      setProtectionError('Falha ao calcular custo de proteção');
      return 0;
    }
  };
  
  /**
   * Versão síncrona do cálculo de proteção (usa o cache se disponível)
   */
  const getProtectionCostSync = (protectionPlanId: string | null): number => {
    if (!protectionPlanId) return 0;
    
    // Se temos no cache, retornar o valor
    if (protectionCostCache[protectionPlanId]) {
      console.log(`Usando custo de proteção em cache (sync) para o plano ${protectionPlanId}: R$ ${protectionCostCache[protectionPlanId].toFixed(2)}`);
      return protectionCostCache[protectionPlanId];
    }
    
    // Se não temos no cache, retornar 0 (será atualizado na próxima renderização)
    console.log(`Sem cache para plano de proteção ${protectionPlanId}, retornando 0 temporariamente`);
    return 0;
  };
  
  return {
    calculateProtectionCost,
    getProtectionCostSync,
    protectionError
  };
}
