
import React, { useState, useEffect } from 'react';
import { Shield, Check } from 'lucide-react';
import { ProtectionPlan } from '@/lib/types/protection';
import { fetchProtectionPlans } from '@/integrations/supabase/services/protectionPlans';

interface ProtectionPlanSelectorProps {
  selectedPlanId: string | null;
  onChange: (planId: string | null) => void;
}

const ProtectionPlanSelector = ({ selectedPlanId, onChange }: ProtectionPlanSelectorProps) => {
  const [plans, setPlans] = useState<ProtectionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProtectionPlans();
  }, []);

  const loadProtectionPlans = async () => {
    try {
      setLoading(true);
      const plansData = await fetchProtectionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar planos de proteção:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Carregando planos de proteção...
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum plano de proteção disponível
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div 
        className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
          selectedPlanId === null ? 'border-primary bg-primary/5' : ''
        }`}
        onClick={() => onChange(null)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Sem Proteção</span>
          </div>
          {selectedPlanId === null && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Sem cobertura adicional
        </p>
        <p className="text-sm font-medium mt-3">R$ 0,00</p>
      </div>

      {plans.map(plan => (
        <div 
          key={plan.id}
          className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedPlanId === plan.id ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onChange(plan.id)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${
                plan.type === 'basic' ? 'text-blue-500' : 
                plan.type === 'intermediate' ? 'text-amber-500' : 'text-green-500'
              }`} />
              <span className="font-medium">{plan.name}</span>
            </div>
            {selectedPlanId === plan.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {plan.description || `Plano de proteção ${plan.name}`}
          </p>
          <p className="text-sm font-medium mt-3">
            R$ {plan.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ProtectionPlanSelector;
