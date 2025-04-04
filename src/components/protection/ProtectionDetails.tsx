
import React, { useState, useEffect } from 'react';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';
import { ProtectionPlanDetails as ProtectionPlanDetailsType } from '@/lib/types/protection';
import { Check, X, Shield, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProtectionDetailsProps {
  planId: string;
  editable?: boolean;
  onBenefitToggle?: (benefitId: string, isIncluded: boolean) => void;
}

const ProtectionDetails = ({ planId, editable = false, onBenefitToggle }: ProtectionDetailsProps) => {
  const [details, setDetails] = useState<ProtectionPlanDetailsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (planId) {
      loadProtectionDetails();
    }
  }, [planId]);

  const loadProtectionDetails = async () => {
    setLoading(true);
    try {
      const planDetails = await fetchProtectionPlanDetails(planId);
      setDetails(planDetails);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano de proteção:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!planId) return null;
  
  if (loading) {
    return (
      <div className="text-center py-2 text-muted-foreground text-sm">
        Carregando detalhes da proteção...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center py-2 text-muted-foreground text-sm">
        Detalhes da proteção não disponíveis
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Proteção {details.name}</span>
            <Badge variant={details.type === 'basic' ? 'outline' : details.type === 'intermediate' ? 'secondary' : 'default'} className="ml-1">
              {details.type === 'basic' ? 'Básica' : details.type === 'intermediate' ? 'Intermediária' : 'Premium'}
            </Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 p-0 px-2"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="ml-1 text-xs">{expanded ? 'Ocultar' : 'Ver'} detalhes</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="text-sm">
          {details.description && (
            <p className="text-muted-foreground mb-3 mt-2">{details.description}</p>
          )}
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="benefits">
              <AccordionTrigger className="text-sm font-medium py-2">
                Benefícios inclusos
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-1">
                  {details.benefits.map(benefit => (
                    <div key={benefit.id} className="flex items-start gap-2">
                      {editable ? (
                        <Checkbox 
                          id={`benefit-${benefit.id}`}
                          checked={benefit.is_included}
                          onCheckedChange={(checked) => {
                            if (onBenefitToggle) {
                              onBenefitToggle(benefit.id, !!checked);
                            }
                          }}
                        />
                      ) : (
                        <div className="pt-0.5">
                          {benefit.is_included ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      )}
                      <label 
                        htmlFor={`benefit-${benefit.id}`}
                        className={`text-sm ${!benefit.is_included && !editable ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {benefit.benefit_name}
                        {benefit.details && (
                          <p className="text-xs text-muted-foreground">{benefit.details}</p>
                        )}
                      </label>
                    </div>
                  ))}
                  
                  {editable && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-xs flex items-center justify-center">
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar novo benefício
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {details.deductibles.length > 0 && (
              <AccordionItem value="deductibles">
                <AccordionTrigger className="text-sm font-medium py-2">
                  Franquias
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-1">
                    {details.deductibles.map(deductible => (
                      <div key={deductible.id} className="flex justify-between items-center text-sm">
                        <span>
                          {deductible.incident_type === 'total_loss' ? 'Perda total' : 'Dano parcial'}
                        </span>
                        <span className="font-medium">{deductible.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ProtectionDetails;
