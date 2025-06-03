import { supabase } from '../client';
import { ProtectionPlan, ProtectionPlanDetails, ProtectionBenefit, ProtectionDeductible } from '@/lib/types/protection';

export async function fetchProtectionPlans(): Promise<ProtectionPlan[]> {
  try {
    console.log('Buscando planos de proteção via service...');
    
    const { data, error } = await supabase
      .from('protection_plans')
      .select('*')
      .order('monthly_cost', { ascending: true });
    
    if (error) {
      console.error('Erro no service ao buscar planos:', error);
      throw error;
    }
    
    console.log('Dados retornados pelo service:', data);
    
    // Validar e converter o tipo para garantir compatibilidade com a interface
    return data?.map(plan => ({
      ...plan,
      type: validatePlanType(plan.type)
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar planos de proteção:', error);
    return [];
  }
}

// Função auxiliar para validar o tipo do plano
function validatePlanType(type: string): 'basic' | 'intermediate' | 'premium' {
  if (type === 'basic' || type === 'intermediate' || type === 'premium') {
    return type;
  }
  // Valor padrão caso o tipo não seja válido
  console.warn(`Tipo de plano inválido: ${type}. Usando 'basic' como padrão.`);
  return 'basic';
}

// Função auxiliar para validar o tipo de incidente
function validateIncidentType(type: string): 'total_loss' | 'partial_damage' {
  if (type === 'total_loss' || type === 'partial_damage') {
    return type;
  }
  // Valor padrão caso o tipo não seja válido
  console.warn(`Tipo de incidente inválido: ${type}. Usando 'partial_damage' como padrão.`);
  return 'partial_damage';
}

export async function fetchProtectionPlanDetails(planId: string): Promise<ProtectionPlanDetails> {
  try {
    console.log(`Buscando detalhes do plano: ${planId}`);
    
    // Buscar informações do plano
    const { data: planData, error: planError } = await supabase
      .from('protection_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error('Erro ao buscar dados do plano:', planError);
      throw planError;
    }
    
    // Buscar benefícios do plano
    const { data: benefitsData, error: benefitsError } = await supabase
      .from('protection_benefits')
      .select('*')
      .eq('plan_id', planId);
    
    if (benefitsError) {
      console.error('Erro ao buscar benefícios:', benefitsError);
      throw benefitsError;
    }
    
    // Buscar franquias do plano
    const { data: deductiblesData, error: deductiblesError } = await supabase
      .from('protection_deductibles')
      .select('*')
      .eq('plan_id', planId);
    
    if (deductiblesError) {
      console.error('Erro ao buscar franquias:', deductiblesError);
      throw deductiblesError;
    }
    
    console.log('Detalhes completos do plano carregados:', {
      plan: planData,
      benefits: benefitsData,
      deductibles: deductiblesData
    });
    
    // Converter para os tipos corretos
    const validatedPlan: ProtectionPlan = {
      ...planData,
      type: validatePlanType(planData.type)
    };
    
    const validatedDeductibles: ProtectionDeductible[] = deductiblesData?.map(deductible => ({
      ...deductible,
      incident_type: validateIncidentType(deductible.incident_type)
    })) || [];
    
    return {
      ...validatedPlan,
      benefits: benefitsData || [],
      deductibles: validatedDeductibles
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

export async function addProtectionBenefit(benefit: Omit<ProtectionBenefit, 'id'>): Promise<ProtectionBenefit | null> {
  try {
    const { data, error } = await supabase
      .from('protection_benefits')
      .insert(benefit)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao adicionar benefício de proteção:', error);
    return null;
  }
}

export async function updateProtectionBenefit(
  benefitId: string, 
  updates: Partial<ProtectionBenefit>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('protection_benefits')
      .update(updates)
      .eq('id', benefitId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar benefício de proteção:', error);
    return false;
  }
}

export async function deleteProtectionBenefit(benefitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('protection_benefits')
      .delete()
      .eq('id', benefitId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir benefício de proteção:', error);
    return false;
  }
}
