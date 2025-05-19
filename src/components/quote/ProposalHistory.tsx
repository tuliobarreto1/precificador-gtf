
import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getProposalsByQuoteId } from '@/integrations/supabase/services/proposals';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProposalHistoryProps {
  quoteId: string;
}

const ProposalHistory: React.FC<ProposalHistoryProps> = ({ quoteId }) => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadProposals() {
      if (!quoteId) return;
      
      setLoading(true);
      try {
        const { success, proposals, error } = await getProposalsByQuoteId(quoteId);
        if (success && proposals) {
          setProposals(proposals);
        } else {
          console.error("Erro ao carregar propostas:", error);
          toast({
            title: "Erro ao carregar propostas",
            description: "Não foi possível carregar o histórico de propostas.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao carregar propostas:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProposals();
  }, [quoteId, toast]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2">
            <span className="animate-spin">◌</span>
            <span>Carregando histórico de propostas...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="p-4">
        <div className="py-6 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhuma proposta gerada para este orçamento.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Histórico de Propostas</h3>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <div 
            key={proposal.id} 
            className="p-3 border rounded-md flex items-center justify-between bg-card"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{proposal.file_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Gerada em {formatDate(proposal.generated_at)}
                    {proposal.sent_at && ` • Enviada em ${formatDate(proposal.sent_at)}`}
                    {proposal.sent_to && ` para ${proposal.sent_to}`}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {proposal.file_url && (
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Visualizar</span>
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Baixar</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ProposalHistory;
