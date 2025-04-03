
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ProtectionPlanDetails } from '@/lib/types/protection';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';

interface ProtectionDetailsProps {
  planId: string | null;
  className?: string;
}

const ProtectionDetails = ({ planId, className = '' }: ProtectionDetailsProps) => {
  const [planDetails, setPlanDetails] = useState<ProtectionPlanDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (planId) {
      loadPlanDetails(planId);
    } else {
      setPlanDetails(null);
    }
  }, [planId]);
  
  const loadPlanDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await fetchProtectionPlanDetails(id);
      setPlanDetails(details);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!planId) {
    return <div className="text-muted-foreground text-sm">Nenhuma proteção selecionada</div>;
  }
  
  if (loading) {
    return <div className="flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      <span className="text-sm">Carregando...</span>
    </div>;
  }
  
  if (!planDetails) {
    return <div className="text-muted-foreground text-sm">Não foi possível carregar os detalhes do plano</div>;
  }
  
  return (
    <div className={`border rounded-md ${className}`}>
      <div 
        className="p-3 flex justify-between items-center cursor-pointer bg-muted/30 hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">{planDetails.name}</span>
          <span className="text-sm text-muted-foreground">(R$ {planDetails.monthly_cost}/mês)</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {planDetails.description && (
            <div>
              <p className="text-sm text-muted-foreground">{planDetails.description}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">Coberturas Incluídas</h4>
            <div className="space-y-1">
              {planDetails.benefits.map(benefit => (
                <div key={benefit.id} className="flex items-center gap-2 text-sm">
                  {benefit.is_included ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> :
                    <XCircle className="h-4 w-4 text-gray-300" />
                  }
                  <span className={benefit.is_included ? '' : 'text-gray-400'}>
                    {benefit.benefit_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Franquias</h4>
            <div className="space-y-1">
              {planDetails.deductibles.map(deductible => (
                <div key={deductible.id} className="flex justify-between text-sm">
                  <span>{deductible.incident_type === 'total_loss' ? 'Perda Total' : 'Danos Parciais'}</span>
                  <span className="font-medium">{deductible.percentage}% do valor do veículo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectionDetails;
