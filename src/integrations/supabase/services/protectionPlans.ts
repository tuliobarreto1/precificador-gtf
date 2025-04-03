
import { supabase } from '../client';
import { ProtectionPlan, ProtectionBenefit, ProtectionDeductible, ProtectionPlanDetails } from '@/lib/types/protection';

// Buscar todos os planos de proteção
export async function fetchProtectionPlans(): Promise<ProtectionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('protection_plans')
      .select('*')
      .order('monthly_cost');
    
    if (error) {
      console.error('Erro ao buscar planos de proteção:', error);
      return [];
    }
    
    return data as ProtectionPlan[];
  } catch (error) {
    console.error('Erro inesperado ao buscar planos de proteção:', error);
    return [];
  }
}

// Buscar um plano de proteção pelo ID com seus benefícios e franquias
export async function fetchProtectionPlanDetails(planId: string): Promise<ProtectionPlanDetails | null> {
  try {
    // Buscar o plano
    const { data: plan, error: planError } = await supabase
      .from('protection_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Erro ao buscar plano de proteção:', planError);
      return null;
    }
    
    // Buscar os benefícios do plano
    const { data: benefits, error: benefitsError } = await supabase
      .from('protection_benefits')
      .select('*')
      .eq('plan_id', planId);
    
    if (benefitsError) {
      console.error('Erro ao buscar benefícios do plano:', benefitsError);
      return null;
    }
    
    // Buscar as franquias do plano
    const { data: deductibles, error: deductiblesError } = await supabase
      .from('protection_deductibles')
      .select('*')
      .eq('plan_id', planId);
    
    if (deductiblesError) {
      console.error('Erro ao buscar franquias do plano:', deductiblesError);
      return null;
    }
    
    return {
      ...plan,
      benefits: benefits || [],
      deductibles: deductibles || []
    } as ProtectionPlanDetails;
  } catch (error) {
    console.error('Erro inesperado ao buscar detalhes do plano de proteção:', error);
    return null;
  }
}

// Atualizar um plano de proteção
export async function updateProtectionPlan(planId: string, data: Partial<ProtectionPlan>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('protection_plans')
      .update(data)
      .eq('id', planId);
    
    if (error) {
      console.error('Erro ao atualizar plano de proteção:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro inesperado ao atualizar plano de proteção:', error);
    return false;
  }
}
