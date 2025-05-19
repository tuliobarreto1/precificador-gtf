import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useQuoteContext } from '@/context/QuoteContext';
import { generateProposal } from '@/lib/proposal-generator';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';

interface GerarPropostaButtonProps {
  offlineMode?: boolean;
}

const GerarPropostaButton: React.FC<GerarPropostaButtonProps> = ({ offlineMode = false }) => {
  const { quote } = useQuoteContext();
  const { toast } = useToast();
  
  const handleGenerateProposal = async () => {
    try {
      const pdfBlob = await generateProposal(quote, offlineMode);
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
