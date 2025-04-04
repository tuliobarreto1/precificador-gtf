
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Plus, Edit, Trash, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  fetchProtectionPlanDetails,
  addProtectionBenefit,
  updateProtectionBenefit,
  deleteProtectionBenefit
} from '@/integrations/supabase/services/protectionPlans';
import { ProtectionBenefit } from '@/lib/types/protection';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [saving, setSaving] = useState(false);
  const [newBenefitName, setNewBenefitName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editBenefitId, setEditBenefitId] = useState<string | null>(null);
  const [editBenefitName, setEditBenefitName] = useState('');
  const [deleteBenefitId, setDeleteBenefitId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleToggleBenefit = async (benefitId: string, isIncluded: boolean) => {
    setSaving(true);
    try {
      const success = await updateProtectionBenefit(benefitId, { is_included: isIncluded });
      
      if (success) {
        const updatedBenefits = benefits.map(benefit => 
          benefit.id === benefitId 
            ? { ...benefit, is_included: isIncluded } 
            : benefit
        );
        
        setBenefits(updatedBenefits);
        
        if (onBenefitsChange) {
          onBenefitsChange(updatedBenefits);
        }
        
        toast({
          title: "Sucesso",
          description: `Benefício ${isIncluded ? 'ativado' : 'desativado'} com sucesso`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o benefício",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o benefício",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBenefit = async () => {
    if (!newBenefitName.trim()) return;
    
    setSaving(true);
    try {
      const newBenefit = await addProtectionBenefit({
        plan_id: planId,
        benefit_name: newBenefitName.trim(),
        is_included: true
      });
      
      if (newBenefit) {
        const updatedBenefits = [...benefits, newBenefit];
        setBenefits(updatedBenefits);
        
        if (onBenefitsChange) {
          onBenefitsChange(updatedBenefits);
        }
        
        toast({
          title: "Sucesso",
          description: "Benefício adicionado com sucesso",
        });
        
        setNewBenefitName('');
        setShowAddForm(false);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o benefício",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar benefício:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o benefício",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (benefit: ProtectionBenefit) => {
    setEditBenefitId(benefit.id);
    setEditBenefitName(benefit.benefit_name);
  };

  const handleCancelEdit = () => {
    setEditBenefitId(null);
    setEditBenefitName('');
  };

  const handleSaveEdit = async () => {
    if (!editBenefitId || !editBenefitName.trim()) return;
    
    setSaving(true);
    try {
      const success = await updateProtectionBenefit(editBenefitId, {
        benefit_name: editBenefitName.trim()
      });
      
      if (success) {
        const updatedBenefits = benefits.map(benefit => 
          benefit.id === editBenefitId 
            ? { ...benefit, benefit_name: editBenefitName.trim() } 
            : benefit
        );
        
        setBenefits(updatedBenefits);
        
        if (onBenefitsChange) {
          onBenefitsChange(updatedBenefits);
        }
        
        toast({
          title: "Sucesso",
          description: "Benefício atualizado com sucesso",
        });
        
        handleCancelEdit();
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o benefício",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao editar benefício:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao editar o benefício",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (benefitId: string) => {
    setDeleteBenefitId(benefitId);
  };

  const cancelDelete = () => {
    setDeleteBenefitId(null);
  };

  const handleDelete = async () => {
    if (!deleteBenefitId) return;
    
    setSaving(true);
    try {
      const success = await deleteProtectionBenefit(deleteBenefitId);
      
      if (success) {
        const updatedBenefits = benefits.filter(benefit => benefit.id !== deleteBenefitId);
        setBenefits(updatedBenefits);
        
        if (onBenefitsChange) {
          onBenefitsChange(updatedBenefits);
        }
        
        toast({
          title: "Sucesso",
          description: "Benefício excluído com sucesso",
        });
        
        setDeleteBenefitId(null);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o benefício",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir benefício:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o benefício",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
          <div key={benefit.id} className="flex items-start gap-2 border-b pb-2">
            {editBenefitId === benefit.id ? (
              <div className="flex flex-grow items-center gap-2">
                <Input
                  value={editBenefitName}
                  onChange={(e) => setEditBenefitName(e.target.value)}
                  placeholder="Nome do benefício"
                  className="text-sm"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveEdit}
                  disabled={saving || !editBenefitName.trim()}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Checkbox 
                  id={`benefit-selector-${benefit.id}`}
                  checked={benefit.is_included}
                  onCheckedChange={(checked) => handleToggleBenefit(benefit.id, !!checked)}
                  className="mt-0.5"
                  disabled={saving}
                />
                <label 
                  htmlFor={`benefit-selector-${benefit.id}`}
                  className={`text-sm cursor-pointer flex-grow ${!benefit.is_included ? 'text-muted-foreground line-through' : ''}`}
                >
                  {benefit.benefit_name}
                </label>
                <div className="flex items-center space-x-1">
                  {benefit.is_included ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 w-7 p-0" 
                    onClick={() => handleStartEdit(benefit)}
                    disabled={saving}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600" 
                    onClick={() => confirmDelete(benefit.id)}
                    disabled={saving}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
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
            disabled={saving}
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleAddBenefit}
              disabled={saving || !newBenefitName.trim()}
            >
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowAddForm(false);
                setNewBenefitName('');
              }}
              disabled={saving}
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
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar novo benefício
        </Button>
      )}

      <AlertDialog open={!!deleteBenefitId} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir benefício</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este benefício? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {saving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProtectionBenefitSelector;
