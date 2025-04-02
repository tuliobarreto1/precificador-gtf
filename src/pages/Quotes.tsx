
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import QuotesHeader from '@/components/quotes/QuotesHeader';
import QuoteStats from '@/components/quotes/QuoteStats';
import QuoteFilters from '@/components/quotes/QuoteFilters';
import QuoteEmpty from '@/components/quotes/QuoteEmpty';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/useQuotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuote } from '@/context/QuoteContext';

const Quotes = () => {
  const { 
    allQuotes, 
    totalQuotes, 
    totalValue, 
    avgValue, 
    loading, 
    handleRefresh 
  } = useQuotes();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const quoteContext = useQuote();
  const { deleteQuote: deleteQuoteFromContext } = quoteContext || {};

  // Garantir que allQuotes é sempre um array
  const safeQuotes = Array.isArray(allQuotes) ? allQuotes : [];

  const handleDeleteClick = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;

    try {
      // Primeiro, tentamos excluir via contexto (para orçamentos locais)
      if (typeof deleteQuoteFromContext === 'function') {
        const success = await deleteQuoteFromContext(quoteToDelete);
        if (success) {
          toast({
            title: "Orçamento excluído",
            description: "O orçamento foi excluído com sucesso."
          });
          handleRefresh();
        } else {
          toast({
            title: "Erro ao excluir",
            description: "Não foi possível excluir o orçamento.",
            variant: "destructive"
          });
        }
      } else {
        // Se não conseguirmos via contexto, tentamos via Supabase diretamente
        try {
          const { deleteQuoteFromSupabase } = await import('@/integrations/supabase/services/quotes');
          const { success, error } = await deleteQuoteFromSupabase(quoteToDelete);
          
          if (success) {
            toast({
              title: "Orçamento excluído",
              description: "O orçamento foi excluído com sucesso."
            });
            handleRefresh();
          } else {
            console.error("Erro ao excluir orçamento do Supabase:", error);
            toast({
              title: "Erro ao excluir",
              description: "Não foi possível excluir o orçamento do banco de dados.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Erro ao importar função de exclusão:", error);
          toast({
            title: "Erro ao excluir",
            description: "Ocorreu um erro ao tentar excluir o orçamento.",
            variant: "destructive"
          });
        }
      }
    } finally {
      setConfirmDeleteOpen(false);
      setQuoteToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setQuoteToDelete(null);
  };

  return (
    <MainLayout>
      <div className="py-8">
        <QuotesHeader />
        
        <QuoteStats 
          totalQuotes={totalQuotes}
          totalValue={totalValue}
          avgValue={avgValue}
        />
        
        <div className="bg-white shadow rounded-md">
          <QuoteFilters 
            loading={loading} 
            onRefresh={handleRefresh} 
          />
          
          {safeQuotes.length === 0 ? (
            <QuoteEmpty />
          ) : (
            <QuoteTable 
              quotes={safeQuotes} 
              onRefresh={handleRefresh}
              onDeleteClick={handleDeleteClick}
            />
          )}
        </div>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Quotes;
