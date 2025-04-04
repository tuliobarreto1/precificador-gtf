
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Plus, Edit, Trash } from 'lucide-react';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { ProtectionPlan, ProtectionDeductible, ProtectionBenefit } from '@/lib/types/protection';
import { fetchProtectionPlans, fetchProtectionPlanDetails, updateProtectionPlan, updateProtectionDeductible } from '@/integrations/supabase/services/protectionPlans';
import ProtectionBenefitSelector from './ProtectionBenefitSelector';

const ProtectionPlansTab = () => {
  const [plans, setPlans] = useState<ProtectionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<{
    deductibles: ProtectionDeductible[];
    benefits: ProtectionBenefit[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProtectionPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      loadPlanDetails(selectedPlanId);
    }
  }, [selectedPlanId]);

  const loadProtectionPlans = async () => {
    setLoading(true);
    try {
      const data = await fetchProtectionPlans();
      setPlans(data);
      
      // Selecionar o primeiro plano por padrão se não houver nenhum selecionado
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id);
      }
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

  const loadPlanDetails = async (planId: string) => {
    setLoadingDetails(true);
    try {
      const details = await fetchProtectionPlanDetails(planId);
      setPlanDetails({
        deductibles: details.deductibles || [],
        benefits: details.benefits || []
      });
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do plano',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
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

  const handleUpdateDeductible = async (deductibleId: string, percentage: number) => {
    setUpdating(deductibleId);
    try {
      const success = await updateProtectionDeductible(deductibleId, { percentage });
      
      if (success) {
        toast({
          title: 'Sucesso',
          description: 'Franquia atualizada com sucesso',
        });
        
        // Atualiza o estado local
        if (planDetails) {
          setPlanDetails({
            ...planDetails,
            deductibles: planDetails.deductibles.map(deductible => 
              deductible.id === deductibleId ? { ...deductible, percentage } : deductible
            )
          });
        }
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a franquia',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar franquia:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar a franquia',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleBenefitsChange = (updatedBenefits: ProtectionBenefit[]) => {
    if (planDetails) {
      setPlanDetails({
        ...planDetails,
        benefits: updatedBenefits
      });
    }
  };

  const renderDeductiblesSection = () => {
    if (loadingDetails) {
      return (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
          <span>Carregando franquias...</span>
        </div>
      );
    }

    if (!planDetails || planDetails.deductibles.length === 0) {
      return (
        <p className="text-sm text-muted-foreground p-4">
          Não há franquias configuradas para este plano.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {planDetails.deductibles.map(deductible => (
          <div key={deductible.id} className="flex items-center gap-4 p-2 border-b">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {deductible.incident_type === 'total_loss' ? 'Perda Total' : 'Dano Parcial'}
              </p>
            </div>
            
            <div className="w-24 flex items-center gap-2">
              <Input 
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={deductible.percentage}
                className="w-16"
                onBlur={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (newValue !== deductible.percentage) {
                    handleUpdateDeductible(deductible.id, newValue);
                  }
                }}
              />
              <span className="text-sm">%</span>
            </div>
            
            {updating === deductible.id && (
              <div className="flex items-center text-xs text-primary">
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                <span>Salvando...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBenefitsSection = () => {
    if (loadingDetails) {
      return (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
          <span>Carregando benefícios...</span>
        </div>
      );
    }

    if (!planDetails) {
      return (
        <p className="text-sm text-muted-foreground p-4">
          Não há benefícios configurados para este plano.
        </p>
      );
    }

    return (
      <ProtectionBenefitSelector 
        planId={selectedPlanId!} 
        onBenefitsChange={handleBenefitsChange}
      />
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Planos de Proteção</h3>
          <p className="text-sm text-muted-foreground">
            Configure os valores mensais, franquias e descrições dos planos de proteção disponíveis.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Carregando planos de proteção...</span>
          </div>
        ) : (
          <div className="p-4">
            <Tabs value={selectedPlanId || undefined} onValueChange={setSelectedPlanId}>
              <TabsList className="mb-4 w-full flex overflow-x-auto">
                {plans.map(plan => (
                  <TabsTrigger 
                    key={plan.id} 
                    value={plan.id}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {plan.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {plans.map(plan => (
                <TabsContent key={plan.id} value={plan.id}>
                  <div className="border rounded-md p-4">
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
                    
                    <Separator className="my-4" />
                    
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="deductibles">
                        <AccordionTrigger className="font-medium text-sm py-2">
                          Franquias
                        </AccordionTrigger>
                        <AccordionContent>
                          {renderDeductiblesSection()}
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="benefits">
                        <AccordionTrigger className="font-medium text-sm py-2">
                          Benefícios
                        </AccordionTrigger>
                        <AccordionContent>
                          {renderBenefitsSection()}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {updating === plan.id && (
                      <div className="flex items-center text-xs text-primary mt-2">
                        <Loader2 className="animate-spin h-3 w-3 mr-1" />
                        <span>Salvando alterações...</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            
            <div className="flex justify-end mt-4">
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
