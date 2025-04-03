
import { supabase } from '../client';
import { ProtectionPlan, ProtectionPlanDetails, ProtectionBenefit, ProtectionDeductible } from '@/lib/types/protection';

export async function fetchProtectionPlans(): Promise<ProtectionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('protection_plans')
      .select('*')
      .order('monthly_cost', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar planos de proteção:', error);
    return [];
  }
}

export async function fetchProtectionPlanDetails(planId: string): Promise<ProtectionPlanDetails> {
  try {
    // Buscar informações do plano
    const { data: planData, error: planError } = await supabase
      .from('protection_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) throw planError;
    
    // Buscar benefícios do plano
    const { data: benefitsData, error: benefitsError } = await supabase
      .from('protection_benefits')
      .select('*')
      .eq('plan_id', planId);
    
    if (benefitsError) throw benefitsError;
    
    // Buscar franquias do plano
    const { data: deductiblesData, error: deductiblesError } = await supabase
      .from('protection_deductibles')
      .select('*')
      .eq('plan_id', planId);
    
    if (deductiblesError) throw deductiblesError;
    
    return {
      ...planData,
      benefits: benefitsData || [],
      deductibles: deductiblesData || []
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do plano de proteção:', error);
    throw error;
  }
}

export async function updateProtectionPlan(
  planId: string, 
  updates: Partial<ProtectionPlan>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('protection_plans')
      .update(updates)
      .eq('id', planId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar plano de proteção:', error);
    return false;
  }
}

export async function updateProtectionDeductible(
  deductibleId: string, 
  updates: Partial<ProtectionDeductible>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('protection_deductibles')
      .update(updates)
      .eq('id', deductibleId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar franquia:', error);
    return false;
  }
}
