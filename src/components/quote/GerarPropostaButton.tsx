
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QuoteFormData, QuoteCalculationResult } from '@/context/types/quoteTypes';
import PropostaTemplate from './PropostaTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { updateQuoteStatus } from '@/lib/status-api';
import { registerProposal } from '@/integrations/supabase/services/proposals';

interface GerarPropostaButtonProps {
  quoteForm: QuoteFormData | null;
  result: QuoteCalculationResult | null;
  currentQuoteId?: string | null;
}

const GerarPropostaButton: React.FC<GerarPropostaButtonProps> = ({ quoteForm, result, currentQuoteId }) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const propostaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!propostaRef.current || !currentQuoteId) {
      toast({
        title: "Erro ao gerar proposta",
        description: "Não foi possível gerar a proposta. Verifique se o orçamento foi salvo.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Criar nome do arquivo baseado no cliente
      const fileName = `Proposta_${quoteForm?.client?.name?.replace(/\s+/g, '_') || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      toast({
        title: "Gerando PDF",
        description: "Aguarde enquanto geramos a proposta em PDF...",
      });

      const element = propostaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Configurar orientação e tamanho (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // Largura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Salvar PDF como blob para upload
      const pdfBlob = pdf.output('blob');
      
      // 1. Atualizar o status do orçamento para PROPOSTA_GERADA
      setIsUpdatingStatus(true);
      const statusUpdateResult = await updateQuoteStatus(
        currentQuoteId, 
        'PROPOSTA_GERADA', 
        'Proposta gerada automaticamente pelo sistema'
      );
      
      if (!statusUpdateResult.success) {
        console.error('Erro ao atualizar status:', statusUpdateResult.error);
        toast({
          title: "Erro ao atualizar status",
          description: "A proposta foi gerada, mas não foi possível atualizar o status do orçamento.",
          variant: "destructive"
        });
      }
      setIsUpdatingStatus(false);
      
      // 2. Salvar registro da proposta no banco
      const registerResult = await registerProposal({
        quote_id: currentQuoteId,
        file_name: fileName,
        generated_by: (await supabase.auth.getUser()).data.user?.id || null,
        status: 'GERADA',
        observation: 'Proposta gerada via sistema'
      });
        
      if (!registerResult.success) {
        console.error('Erro ao registrar proposta:', registerResult.error);
        toast({
          title: "Erro ao registrar proposta",
          description: "A proposta foi gerada, mas não foi possível registrar no sistema.",
          variant: "destructive"
        });
      } else {
        console.log('Proposta registrada com sucesso:', registerResult.proposal);
      }
      
      // Salvar o PDF localmente
      pdf.save(fileName);
      
      toast({
        title: "Proposta gerada com sucesso!",
        description: `O arquivo ${fileName} foi salvo e o status atualizado para "Proposta Gerada".`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um problema ao gerar o arquivo PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setIsUpdatingStatus(false);
    }
  };
  
  // Verificar se podemos gerar a proposta (orçamento deve estar salvo)
  const canGenerateProposal = Boolean(currentQuoteId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full"
          disabled={!canGenerateProposal}
        >
          <FileText size={16} />
          Gerar Proposta com Timbre
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Proposta</DialogTitle>
        </DialogHeader>
        
        {!canGenerateProposal && (
          <div className="p-4 bg-amber-100 border border-amber-300 rounded-md text-amber-800 mb-4">
            <p>Para gerar uma proposta, é necessário primeiro salvar o orçamento.</p>
          </div>
        )}
        
        <div className="border rounded-md p-2 bg-gray-50 overflow-auto">
          <div className="flex justify-center">
            <PropostaTemplate ref={propostaRef} quote={quoteForm} result={result} />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGeneratePDF} 
            disabled={isGenerating || isUpdatingStatus || !canGenerateProposal}
            className="gap-2"
          >
            {isGenerating || isUpdatingStatus ? (
              <>
                <span className="animate-spin">◌</span>
                {isGenerating ? "Gerando PDF..." : "Atualizando status..."}
              </>
            ) : (
              <>
                <FileText size={16} />
                Gerar e Atualizar Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GerarPropostaButton;
