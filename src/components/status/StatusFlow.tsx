
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { allStatus, QuoteStatusFlow, isValidTransition, statusInfo } from '@/lib/status-flow';
import { updateQuoteStatus } from '@/lib/status-api';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from './StatusBadge';
import StatusProgressBar from './StatusProgressBar';

interface StatusFlowProps {
  quoteId: string;
  currentStatus: QuoteStatusFlow;
  onStatusUpdate?: () => void;
}

const StatusFlow: React.FC<StatusFlowProps> = ({ 
  quoteId, 
  currentStatus,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatusFlow | ''>('');
  const [observation, setObservation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  
  // Filtrar status válidos para transição
  const validNextStatuses = allStatus.filter(status => 
    status !== currentStatus && isValidTransition(currentStatus, status)
  );
  
  const handleStatusChange = (status: QuoteStatusFlow) => {
    setSelectedStatus(status);
  };
  
  const handleOpenDialog = () => {
    if (!selectedStatus) {
      toast({
        title: "Selecione um status",
        description: "Você precisa selecionar um status antes de continuar.",
        variant: "destructive"
      });
      return;
    }
    
    setShowDialog(true);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      const result = await updateQuoteStatus(quoteId, selectedStatus, observation);
      
      if (result.success) {
        toast({
          title: "Status atualizado",
          description: `Status alterado para ${statusInfo[selectedStatus].label} com sucesso.`
        });
        
        // Limpar campos
        setSelectedStatus('');
        setObservation('');
        
        // Chamar callback se existir
        if (onStatusUpdate) onStatusUpdate();
        
        // Fechar o diálogo
        setShowDialog(false);
        
        // Recarregar a página para refletir as mudanças
        window.location.reload();
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: result.error?.message || "Ocorreu um erro ao atualizar o status.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Status atual e barra de progresso */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <div>
            <span className="text-sm font-medium mr-2">Status atual:</span>
            <StatusBadge status={currentStatus} />
          </div>
          <div className="text-sm text-muted-foreground">
            {statusInfo[currentStatus].description}
          </div>
        </div>
        
        <StatusProgressBar currentStatus={currentStatus} className="mt-4" />
      </div>
      
      {/* Seletor de próximo status */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium mb-1 block">
              Selecione o próximo status:
            </label>
            <Select value={selectedStatus} onValueChange={(value) => handleStatusChange(value as QuoteStatusFlow)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status..." />
              </SelectTrigger>
              <SelectContent>
                {validNextStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusInfo[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleOpenDialog}
              disabled={!selectedStatus}
              className="w-full"
            >
              Atualizar Status
            </Button>
          </div>
        </div>
      </div>
      
      {/* Diálogo de confirmação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar mudança de status</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar o status de <span className="font-semibold">{statusInfo[currentStatus].label}</span> para <span className="font-semibold">{selectedStatus ? statusInfo[selectedStatus].label : ''}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label htmlFor="observation" className="text-sm font-medium block mb-2">
              Observação (opcional):
            </label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Adicione uma observação sobre esta mudança de status..."
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Atualizando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusFlow;
