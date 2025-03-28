
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { QuoteStatusFlow, statusInfo, allStatus, isValidTransition } from '@/lib/status-flow';
import { supabase } from '@/integrations/supabase/client';
import StatusBadge from './StatusBadge';

interface StatusUpdaterProps {
  quoteId: string;
  currentStatus: QuoteStatusFlow;
  onUpdate?: () => void;
  disabled?: boolean;
}

const StatusUpdater: React.FC<StatusUpdaterProps> = ({ 
  quoteId, 
  currentStatus,
  onUpdate,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatusFlow | null>(null);
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Calcular possíveis próximos status (permitindo avançar apenas para o próximo ou retornar a qualquer anterior)
  const currentIndex = allStatus.indexOf(currentStatus);
  const nextStatus = currentIndex < allStatus.length - 1 ? allStatus[currentIndex + 1] : null;
  const previousStatuses = allStatus.slice(0, currentIndex);
  
  // Possíveis status para transição
  const possibleStatuses = [
    ...previousStatuses,
    nextStatus
  ].filter(Boolean) as QuoteStatusFlow[];
  
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast({
        title: "Selecione um status",
        description: "É necessário selecionar um novo status",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Atualizar status no Supabase
      const { error } = await supabase
        .from('quotes')
        .update({ status_flow: selectedStatus })
        .eq('id', quoteId);
      
      if (error) {
        console.error("Erro ao atualizar status:", error);
        toast({
          title: "Erro ao atualizar status",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Se tiver observação, adicionar manualmente ao histórico
      if (observation) {
        await supabase
          .from('quote_status_history')
          .insert({
            quote_id: quoteId,
            previous_status: currentStatus,
            new_status: selectedStatus,
            observation: observation
          });
      }
      
      toast({
        title: "Status atualizado",
        description: `Status atualizado para: ${statusInfo[selectedStatus].label}`
      });
      
      // Fechar o diálogo e limpar o estado
      setOpen(false);
      setSelectedStatus(null);
      setObservation('');
      
      // Chamar a função de callback se fornecida
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar o status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={disabled || possibleStatuses.length === 0}
        >
          Atualizar Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Status</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>Status Atual</Label>
            <StatusBadge status={currentStatus} showDescription size="lg" className="w-fit" />
          </div>
          
          <div className="space-y-4">
            <Label>Selecione o Novo Status</Label>
            
            <RadioGroup 
              value={selectedStatus || ""}
              onValueChange={(value) => setSelectedStatus(value as QuoteStatusFlow)}
            >
              <div className="space-y-3">
                {possibleStatuses.map((status) => (
                  <div key={status} className="flex items-start space-x-2">
                    <RadioGroupItem value={status} id={`status-${status}`} />
                    <Label 
                      htmlFor={`status-${status}`} 
                      className="flex-1 cursor-pointer flex items-center"
                    >
                      <StatusBadge status={status} showDescription className="w-fit" />
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            
            {possibleStatuses.length === 0 && (
              <div className="text-sm text-amber-600">
                Não há status disponíveis para transição.
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea 
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Adicione informações sobre esta mudança de status"
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || isSubmitting}
          >
            {isSubmitting ? "Atualizando..." : "Atualizar Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdater;
