
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';
import { ProtectionBenefit } from '@/lib/types/protection';

interface ProtectionBenefitSelectorProps {
  planId: string;
  onBenefitsChange?: (benefits: ProtectionBenefit[]) => void;
}

const ProtectionBenefitSelector: React.FC<ProtectionBenefitSelectorProps> = ({
  planId,
  onBenefitsChange
}) => {
  const [benefits, setBenefits] = useState<ProtectionBenefit[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBenefitName, setNewBenefitName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (planId) {
      loadBenefits();
    }
  }, [planId]);

  const loadBenefits = async () => {
    setLoading(true);
    try {
      const details = await fetchProtectionPlanDetails(planId);
      if (details && details.benefits) {
        setBenefits(details.benefits);
        
        if (onBenefitsChange) {
          onBenefitsChange(details.benefits);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBenefit = (benefitId: string, isIncluded: boolean) => {
    const updatedBenefits = benefits.map(benefit => 
      benefit.id === benefitId 
        ? { ...benefit, is_included: isIncluded } 
        : benefit
    );
    
    setBenefits(updatedBenefits);
    
    if (onBenefitsChange) {
      onBenefitsChange(updatedBenefits);
    }
  };

  const handleAddBenefit = () => {
    if (!newBenefitName.trim()) return;
    
    const newBenefit: ProtectionBenefit = {
      id: `temp-${Date.now()}`,
      plan_id: planId,
      benefit_name: newBenefitName.trim(),
      is_included: true
    };
    
    const updatedBenefits = [...benefits, newBenefit];
    setBenefits(updatedBenefits);
    
    if (onBenefitsChange) {
      onBenefitsChange(updatedBenefits);
    }
    
    setNewBenefitName('');
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando benefícios...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center mb-2">
        <Shield className="h-4 w-4 mr-2 text-primary" />
        <h3 className="text-sm font-medium">Benefícios da proteção</h3>
      </div>
      
      <div className="space-y-2">
        {benefits.map(benefit => (
          <div key={benefit.id} className="flex items-start gap-2">
            <Checkbox 
              id={`benefit-selector-${benefit.id}`}
              checked={benefit.is_included}
              onCheckedChange={(checked) => handleToggleBenefit(benefit.id, !!checked)}
              className="mt-0.5"
            />
            <label 
              htmlFor={`benefit-selector-${benefit.id}`}
              className="text-sm cursor-pointer"
            >
              {benefit.benefit_name}
            </label>
          </div>
        ))}
      </div>
      
      {showAddForm ? (
        <div className="pt-2 space-y-2">
          <Input
            value={newBenefitName}
            onChange={(e) => setNewBenefitName(e.target.value)}
            placeholder="Nome do novo benefício"
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleAddBenefit}
              disabled={!newBenefitName.trim()}
            >
              Adicionar
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowAddForm(false);
                setNewBenefitName('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center justify-center"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar novo benefício
        </Button>
      )}
    </div>
  );
};

export default ProtectionBenefitSelector;
