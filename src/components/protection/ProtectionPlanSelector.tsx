
import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProtectionPlan } from '@/lib/types/protection';
import { fetchProtectionPlans } from '@/integrations/supabase/services/protectionPlans';
import ProtectionDetails from './ProtectionDetails';

interface ProtectionPlanSelectorProps {
  selectedPlanId: string | null;
  onChange: (planId: string | null) => void;
  className?: string;
}

const ProtectionPlanSelector = ({ selectedPlanId, onChange, className = '' }: ProtectionPlanSelectorProps) => {
  const [plans, setPlans] = useState<ProtectionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProtectionPlans();
  }, []);

  const loadProtectionPlans = async () => {
    setLoading(true);
    try {
      const data = await fetchProtectionPlans();
      setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos de proteção:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Select 
          value={selectedPlanId || ''} 
          onValueChange={(value) => onChange(value ? value : null)}
        >
          <SelectTrigger className="w-full" disabled={loading}>
            <SelectValue placeholder="Selecione um plano de proteção">
              {loading ? 'Carregando...' : ''}
              {selectedPlanId && !loading ? plans.find(p => p.id === selectedPlanId)?.name || 'Plano de proteção' : ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem proteção</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>{plan.name}</span>
                  <span className="text-muted-foreground ml-2">
                    R$ {plan.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlanId && (
        <ProtectionDetails planId={selectedPlanId} />
      )}
    </div>
  );
};

export default ProtectionPlanSelector;
