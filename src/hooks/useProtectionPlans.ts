
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProtectionPlan {
  id: string;
  name: string;
  description?: string;
  type: 'basic' | 'intermediate' | 'premium';
  monthlyCost: number;
}

export function useProtectionPlans() {
  const [plans, setPlans] = useState<ProtectionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('protection_plans')
        .select('*')
        .order('monthly_cost', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar planos de proteção:', error);
        setError('Não foi possível carregar os planos de proteção');
        return;
      }
      
      // Transformar os dados para o formato esperado
      const formattedPlans = data.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        type: plan.type || 'basic',
        monthlyCost: plan.monthly_cost
      }));
      
      setPlans(formattedPlans);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar planos de proteção:', err);
      setError('Ocorreu um erro ao carregar os planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refreshPlans: fetchPlans
  };
}
