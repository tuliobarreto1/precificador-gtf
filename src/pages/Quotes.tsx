
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
import { deleteQuoteFromSupabase } from '@/integrations/supabase/services/quotes';
import { QuoteItem } from '@/context/types/quoteTypes';

const Quotes = () => {
  const { 
    filteredQuotes, 
    totalQuotes, 
    totalValue, 
    avgValue, 
    loading, 
    handleRefresh,
    setRefreshTriggerDirectly,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters
  } = useQuotes();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const quoteContext = useQuote();
  const { deleteQuote: deleteQuoteFromContext } = quoteContext || {};

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (key: 'status' | 'dateRange' | 'createdBy', value: string | null) => {
    setFilter(key, value);
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchTerm('');
  };

  // Garantir que todos os orçamentos tenham contractMonths definido
  const safeQuotes: QuoteItem[] = Array.isArray(filteredQuotes) ? filteredQuotes.map(quote => ({
    ...quote,
    contractMonths: quote.contractMonths || 0
  })) : [];

  const handleDeleteClick = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    
    setIsDeleting(true);

    try {
      console.log("🗑️ Iniciando processo de exclusão para orçamento:", quoteToDelete);
      
      let success = false;
      
      if (typeof deleteQuoteFromContext === 'function') {
        console.log("📌 Tentando excluir via contexto...");
        success = await deleteQuoteFromContext(quoteToDelete);
        console.log("📝 Resultado da exclusão via contexto:", success);
      }

      if (!success) {
        console.log("📌 Tentando excluir diretamente via Supabase:", quoteToDelete);
        const result = await deleteQuoteFromSupabase(quoteToDelete);
        success = result.success;
        console.log("📝 Resultado da exclusão via Supabase:", result);
      }

      if (success) {
        toast({
          title: "Orçamento excluído",
          description: "O orçamento foi excluído com sucesso."
        });
        
        setRefreshTriggerDirectly();
        
        setTimeout(() => {
          handleRefresh();
          setTimeout(() => {
            setRefreshTriggerDirectly();
          }, 2000);
        }, 2000);
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o orçamento. Verifique o console para mais detalhes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erro ao excluir orçamento:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro inesperado ao tentar excluir o orçamento.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
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
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Quotes;
