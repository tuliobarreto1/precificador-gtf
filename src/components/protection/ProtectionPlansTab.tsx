
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { Card } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ProtectionPlan } from '@/lib/types/protection';
import { fetchProtectionPlans, updateProtectionPlan } from '@/integrations/supabase/services/protectionPlans';

const ProtectionPlansTab = () => {
  const [plans, setPlans] = useState<ProtectionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

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
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos de proteção',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (planId: string, field: string, value: string | number) => {
    setUpdating(planId);
    try {
      const success = await updateProtectionPlan(planId, { [field]: value });
      
      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Plano de proteção atualizado com sucesso',
        });
        
        // Atualiza o estado local
        setPlans(plans.map(plan => 
          plan.id === planId ? { ...plan, [field]: value } : plan
        ));
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o plano de proteção',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o plano de proteção',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Planos de Proteção</h3>
          <p className="text-sm text-muted-foreground">
            Configure os valores mensais e descrições dos planos de proteção disponíveis.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Carregando planos de proteção...</span>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {plans.map(plan => (
              <div key={plan.id} className="border rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">{plan.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {plan.type}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`monthly-cost-${plan.id}`}>Valor Mensal (R$)</Label>
                    <div className="relative mt-1">
                      <Input 
                        id={`monthly-cost-${plan.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={plan.monthly_cost}
                        className="pl-8"
                        onBlur={(e) => {
                          const newValue = parseFloat(e.target.value);
                          if (newValue !== plan.monthly_cost) {
                            handleUpdatePlan(plan.id, 'monthly_cost', newValue);
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">R$</span>
                      </div>
                    </div>
                  </div>
                
                  <div>
                    <Label htmlFor={`description-${plan.id}`}>Descrição</Label>
                    <Textarea 
                      id={`description-${plan.id}`}
                      className="mt-1"
                      defaultValue={plan.description || ''}
                      rows={2}
                      onBlur={(e) => {
                        if (e.target.value !== plan.description) {
                          handleUpdatePlan(plan.id, 'description', e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>
                
                {updating === plan.id && (
                  <div className="flex items-center text-xs text-primary">
                    <Loader2 className="animate-spin h-3 w-3 mr-1" />
                    <span>Salvando alterações...</span>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex justify-end">
              <Button 
                onClick={loadProtectionPlans} 
                variant="outline"
              >
                Atualizar Lista
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProtectionPlansTab;
