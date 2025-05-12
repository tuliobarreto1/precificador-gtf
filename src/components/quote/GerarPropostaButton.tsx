
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QuoteFormData, QuoteCalculationResult } from '@/context/types/quoteTypes';
import PropostaTemplate from './PropostaTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GerarPropostaButtonProps {
  quoteForm: QuoteFormData | null;
  result: QuoteCalculationResult | null;
}

const GerarPropostaButton: React.FC<GerarPropostaButtonProps> = ({ quoteForm, result }) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const propostaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!propostaRef.current) return;

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
      pdf.save(fileName);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: `O arquivo ${fileName} foi salvo no seu computador.`,
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText size={16} />
          Gerar Proposta PDF
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Proposta</DialogTitle>
        </DialogHeader>
        
        <div className="border rounded-md p-2 bg-gray-50 overflow-auto">
          <div className="flex justify-center">
            <PropostaTemplate ref={propostaRef} quote={quoteForm} result={result} />
          </div>
        </div>
        
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGeneratePDF} disabled={isGenerating}>
            {isGenerating ? "Gerando..." : "Baixar PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GerarPropostaButton;
