
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitleFixed from '@/components/ui-custom/PageTitleFixed';
import QuoteDetail from '@/components/quotes/QuoteDetail';
import { SavedQuote } from '@/context/types/quoteTypes';
import { getQuoteByIdFromSupabase } from '@/integrations/supabase/services/quotes';
import { deleteQuoteFromSupabase } from '@/integrations/supabase/services/quotes';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/context/QuoteContext';

const QuoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const { sendQuoteByEmail } = useQuote();
  
  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError("ID do orçamento não fornecido");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Buscando orçamento com ID:', id);
        
        const { quote: fetchedQuote, error } = await getQuoteByIdFromSupabase(id);
        
        if (fetchedQuote) {
          console.log('Orçamento encontrado:', fetchedQuote);
          setQuote(fetchedQuote);
        } else {
          console.error('Erro ao buscar orçamento:', error);
          setError(error || "Não foi possível carregar os detalhes do orçamento.");
          toast({
            title: "Erro ao carregar orçamento",
            description: error || "Não foi possível carregar os detalhes do orçamento.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        setError("Ocorreu um erro inesperado ao buscar o orçamento.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
  }, [id, toast]);

  const handleSendEmail = async (email: string, message: string): Promise<boolean> => {
    if (!id) return false;
    
    try {
      console.log('Enviando orçamento por e-mail:', { quoteId: id, email, message });
      const result = await sendQuoteByEmail(id, email, message);
      return result;
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Ocorreu um erro ao tentar enviar o email. Verifique as configurações."
      });
      return false;
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const { success, error } = await deleteQuoteFromSupabase(id);
      
      if (success) {
        toast({
          title: "Orçamento excluído",
          description: "O orçamento foi excluído com sucesso."
        });
        navigate('/orcamentos');
      } else {
        toast({
          title: "Erro ao excluir",
          description: error?.message || "Não foi possível excluir o orçamento.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o orçamento.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = () => {
    navigate(`/editar-orcamento/${id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
          
          <div className="space-y-3 mt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !quote) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">
            {error ? "Erro ao carregar orçamento" : "Orçamento não encontrado"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "O orçamento solicitado não foi encontrado ou foi excluído."}
          </p>
          <Button onClick={() => navigate('/orcamentos')}>Voltar para Lista</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageTitleFixed
        title={`Orçamento: ${quote.clientName}`}
        breadcrumbs={[
          { label: 'Home', url: '/' },
          { label: 'Orçamentos', url: '/orcamentos' },
          { label: quote.clientName || 'Detalhes', url: `/orcamento/${quote.id}` }
        ]}
      />

      <QuoteDetail
        quote={quote}
        onSendEmail={handleSendEmail}
        onDelete={() => setShowDeleteConfirm(true)}
        onEdit={handleEdit}
        canEdit={true}
        canDelete={true}
      />
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Orçamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default QuoteDetailPage;
