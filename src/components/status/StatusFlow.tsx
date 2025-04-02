
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type QuoteStatus = 'ORCAMENTO' | 'PROPOSTA_GERADA' | 'EM_VERIFICACAO' | 'APROVADA' | 
                   'CONTRATO_GERADO' | 'ASSINATURA_CLIENTE' | 'ASSINATURA_DIRETORIA' | 
                   'AGENDAMENTO_ENTREGA' | 'ENTREGA' | 'CONCLUIDO';

const STATUS_OPTIONS: { value: QuoteStatus; label: string; color: string }[] = [
  { value: 'ORCAMENTO', label: 'Orçamento', color: 'bg-gray-200' },
  { value: 'PROPOSTA_GERADA', label: 'Proposta Gerada', color: 'bg-blue-200' },
  { value: 'EM_VERIFICACAO', label: 'Em Verificação', color: 'bg-yellow-200' },
  { value: 'APROVADA', label: 'Aprovada', color: 'bg-green-200' },
  { value: 'CONTRATO_GERADO', label: 'Contrato Gerado', color: 'bg-emerald-200' },
  { value: 'ASSINATURA_CLIENTE', label: 'Assinatura Cliente', color: 'bg-teal-200' },
  { value: 'ASSINATURA_DIRETORIA', label: 'Assinatura Diretoria', color: 'bg-cyan-200' },
  { value: 'AGENDAMENTO_ENTREGA', label: 'Agendamento Entrega', color: 'bg-indigo-200' },
  { value: 'ENTREGA', label: 'Entrega', color: 'bg-purple-200' },
  { value: 'CONCLUIDO', label: 'Concluído', color: 'bg-green-300' },
];

interface StatusFlowProps {
  quoteId: string;
  currentStatus: QuoteStatus;
}

export const StatusFlow: React.FC<StatusFlowProps> = ({ quoteId, currentStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus>(currentStatus);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatus = async () => {
    if (selectedStatus === currentStatus) {
      toast({
        title: "Sem alterações",
        description: "O status selecionado é o mesmo que o atual.",
      });
      return;
    }

    try {
      setUpdating(true);

      // Atualizar o status no banco de dados
      const { error } = await supabase
        .from('quotes')
        .update({ status_flow: selectedStatus, updated_at: new Date().toISOString() })
        .eq('id', quoteId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: "Erro ao atualizar",
          description: error.message || "Não foi possível atualizar o status do orçamento.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Status atualizado",
        description: `O orçamento foi movido para: ${STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}`,
      });

    } catch (err) {
      console.error('Exceção ao atualizar status:', err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar atualizar o status.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Determina o índice do status atual para mostrar o progresso
  const currentStatusIndex = STATUS_OPTIONS.findIndex(option => option.value === currentStatus);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">Status atual:</p>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${STATUS_OPTIONS.find(s => s.value === currentStatus)?.color}`}></div>
            <span className="font-medium">{STATUS_OPTIONS.find(s => s.value === currentStatus)?.label}</span>
          </div>
        </div>
        
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-green-500 transition-all duration-300" 
            style={{ 
              width: `${Math.max(5, Math.min(100, ((currentStatusIndex + 1) / STATUS_OPTIONS.length) * 100))}%` 
            }}
          ></div>
        </div>
      </div>

      <div className="border rounded-md p-4">
        <h4 className="text-sm font-medium mb-3">Atualizar status para:</h4>
        
        <RadioGroup 
          value={selectedStatus} 
          onValueChange={(value) => setSelectedStatus(value as QuoteStatus)}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`status-${option.value}`} />
              <Label 
                htmlFor={`status-${option.value}`} 
                className={`flex items-center space-x-2 cursor-pointer ${
                  option.value === currentStatus ? 'font-medium text-primary' : ''
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${option.color}`}></div>
                <span>{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <div className="mt-4">
          <Button 
            onClick={handleUpdateStatus} 
            disabled={updating || selectedStatus === currentStatus}
            className="w-full md:w-auto"
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Status'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
