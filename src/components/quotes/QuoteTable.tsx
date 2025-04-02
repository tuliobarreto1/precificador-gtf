
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/status/StatusBadge';
import { QuoteStatusFlow } from '@/lib/status-flow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { deleteQuoteFromSupabase } from '@/integrations/supabase';

interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName: string;
  value: number;
  createdAt: string;
  status: string;
  source: 'demo' | 'local' | 'supabase';
  createdBy?: {
    id: number;
    name: string;
    role: string;
  };
}

interface QuoteTableProps {
  quotes: QuoteItem[];
  onRefresh?: () => void;
  loading?: boolean;
  onDeleteQuote?: (id: string) => void;
}

const QuoteTable = ({ quotes, onRefresh, loading, onDeleteQuote }: QuoteTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Garantir que quotes é sempre um array
  const safeQuotes = Array.isArray(quotes) ? quotes : [];

  const handleDeleteClick = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (quoteToDelete) {
      setDeleting(true);
      try {
        // Informações do usuário para o log (simplificado)
        const userId = "sistema";
        const userName = "Sistema";
        
        // Excluir no Supabase com registro de log
        const { success, error } = await deleteQuoteFromSupabase(
          quoteToDelete,
          userId,
          userName
        );
        
        if (success) {
          toast({
            title: "Orçamento excluído",
            description: "O orçamento foi excluído com sucesso e a ação foi registrada."
          });
          
          if (onDeleteQuote) {
            onDeleteQuote(quoteToDelete);
          }
          
          if (onRefresh) {
            onRefresh();
          }
        } else {
          toast({
            title: "Erro ao excluir",
            description: error?.message || "Não foi possível excluir o orçamento.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao excluir orçamento:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro inesperado ao excluir o orçamento.",
          variant: "destructive"
        });
      } finally {
        setDeleting(false);
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuoteToDelete(null);
  };

  // Função simplificada para verificação de permissões
  const canEdit = (quote: QuoteItem) => {
    // Por padrão, permitir editar orçamentos que estão em progresso
    return quote.status === 'ORCAMENTO' || quote.status === 'draft';
  };
  
  const canDelete = (quote: QuoteItem) => {
    // Por padrão, permitir excluir qualquer orçamento
    return true;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhum orçamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              safeQuotes.map((quote) => {
                const isEditable = canEdit(quote);
                const isDeletable = canDelete(quote);
                
                return (
                  <TableRow key={`${quote.source}-${quote.id}`}>
                    <TableCell>
                      <Link to={`/orcamento/${quote.id}`}>
                        <span className="font-medium hover:text-primary">
                          {quote.clientName || "Cliente não especificado"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{quote.vehicleName || "Veículo não especificado"}</TableCell>
                    <TableCell>
                      R$ {Number(quote.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={(quote.status || 'ORCAMENTO') as QuoteStatusFlow} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        quote.source === 'supabase' ? 'bg-blue-50 text-blue-700' : 
                        quote.source === 'local' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                      }`}>
                        {quote.source === 'supabase' ? 'Supabase' : 
                        quote.source === 'local' ? 'Local' : 'Demo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Link to={`/orcamento/${quote.id}`}>
                        <Button variant="link" size="sm">Ver</Button>
                      </Link>
                      
                      {isEditable && (
                        <Link to={`/editar-orcamento/${quote.id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      
                      {isDeletable && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(quote.id)}
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
              <p className="mt-2 text-sm text-muted-foreground">
                Um registro desta exclusão será salvo no sistema.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuoteTable;
