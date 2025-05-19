
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useQuote } from '@/context/QuoteContext';
import { generateProposal } from '@/lib/proposal-generator';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { QuoteFormData, QuoteCalculationResult, SavedQuote } from '@/context/types/quoteTypes';

interface GerarPropostaButtonProps {
  offlineMode?: boolean;
  quoteForm?: QuoteFormData;
  result?: QuoteCalculationResult | null;
  currentQuoteId?: string;
  savedQuote?: SavedQuote;
}

const GerarPropostaButton: React.FC<GerarPropostaButtonProps> = ({ 
  offlineMode = false,
  quoteForm,
  result,
  currentQuoteId,
  savedQuote
}) => {
  const { quoteForm: contextQuoteForm } = useQuote();
  const { toast } = useToast();
  
  const handleGenerateProposal = async () => {
    try {
      // Usar dados fornecidos via props ou do contexto
      const dataToUse = quoteForm || contextQuoteForm;
      
      const pdfBlob = await generateProposal(dataToUse, offlineMode);
      saveAs(pdfBlob, `proposta-orcamento-${new Date().toISOString()}.pdf`);
      toast({
        title: "Proposta gerada com sucesso!",
        description: "O arquivo PDF foi baixado para o seu dispositivo.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar proposta:", error);
      toast({
        title: "Erro ao gerar proposta",
        description: error.message || "Ocorreu um erro ao gerar a proposta. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button 
      onClick={handleGenerateProposal}
      className="w-full flex items-center justify-center"
    >
      Gerar Proposta
      <Download className="ml-2 h-4 w-4" />
    </Button>
  );
};

export default GerarPropostaButton;
