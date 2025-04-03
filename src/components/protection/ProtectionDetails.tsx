
import React, { useState, useEffect } from 'react';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';
import { ProtectionPlanDetails as ProtectionPlanDetailsType } from '@/lib/types/protection';
import { Check, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProtectionDetailsProps {
  planId: string;
}

const ProtectionDetails = ({ planId }: ProtectionDetailsProps) => {
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Proteção {details.name}</span>
          <Badge variant={details.type === 'basic' ? 'outline' : details.type === 'intermediate' ? 'secondary' : 'default'} className="ml-1">
            {details.type === 'basic' ? 'Básica' : details.type === 'intermediate' ? 'Intermediária' : 'Premium'}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="h-8 p-0 px-2"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="ml-1 text-xs">{expanded ? 'Ocultar' : 'Ver'} detalhes</span>
        </Button>
      </div>

      {expanded && (
        <div className="text-sm animate-fadeIn">
          {details.description && (
            <p className="text-muted-foreground mb-3">{details.description}</p>
          )}
          
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium mb-1">Benefícios inclusos</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {details.benefits.map(benefit => (
                  <li 
                    key={benefit.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    {benefit.is_included ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-600" />
                    )}
                    <span className={benefit.is_included ? '' : 'text-muted-foreground line-through'}>
                      {benefit.benefit_name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {details.deductibles.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-1">Franquias</h4>
                <ul className="space-y-1">
                  {details.deductibles.map(deductible => (
                    <li key={deductible.id} className="text-xs flex justify-between">
                      <span>{deductible.incident_type === 'total_loss' ? 'Perda total' : 'Dano parcial'}</span>
                      <span className="font-medium">{deductible.percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectionDetails;
