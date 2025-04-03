
export interface ProtectionPlan {
  id: string;
  name: string;
  description: string | null;
  monthly_cost: number;
  type: 'basic' | 'intermediate' | 'premium';
  created_at?: string;
  updated_at?: string;
}

export interface ProtectionBenefit {
  id: string;
  plan_id: string;
  benefit_name: string;
  is_included: boolean;
  details?: string | null;
}

export interface ProtectionDeductible {
  id: string;
  plan_id: string;
  incident_type: 'total_loss' | 'partial_damage';
  percentage: number;
}

export interface ProtectionPlanDetails extends ProtectionPlan {
  benefits: ProtectionBenefit[];
  deductibles: ProtectionDeductible[];
}
