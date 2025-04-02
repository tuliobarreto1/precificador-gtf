
import React, { useState } from 'react';
import { Eye, Edit, Trash, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from 'react-router-dom';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { deleteQuoteFromSupabase } from '@/integrations/supabase';
import { useToast } from '@/hooks/use-toast';

export interface QuoteTableItem {
  id: string;
  clientName: string;
  vehicleName: string;
  value: number;
  createdAt: string;
  status: string;
  source?: 'demo' | 'local' | 'supabase';
  createdBy?: string;
}

interface QuoteTableProps {
  quotes: QuoteTableItem[];
  loading?: boolean;
  onDeleteQuote?: (id: string) => void;
}

export const QuoteTable: React.FC<QuoteTableProps> = ({ quotes, loading, onDeleteQuote }) => {
  const { user, adminUser, isAdmin, isSupervisor } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return dateString;
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Verifica se o usuário tem permissão para editar/excluir um orçamento
  const canModifyQuote = (quoteCreatedBy?: string) => {
    // Admin e supervisor podem modificar qualquer orçamento
    if (isAdmin || isSupervisor) return true;
    
    // Usuários normais só podem modificar seus próprios orçamentos
    if (user?.id && quoteCreatedBy === user.id) return true;
    
    return false;
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    setDeletingId(id);
    setIsDeleting(true);
    
    try {
      const userId = user?.id || adminUser?.id;
      const userName = user?.name || adminUser?.name || 'Usuário';
      
      const { success, error } = await deleteQuoteFromSupabase(id, userId, userName);
      
      if (success) {
        toast({
          title: "Orçamento excluído",
          description: "O orçamento foi excluído com sucesso."
        });
        
        // Chamar o callback se existir
        if (onDeleteQuote) {
          onDeleteQuote(id);
        }
      } else {
        toast({
          title: "Erro ao excluir",
          description: `Não foi possível excluir o orçamento: ${error?.message || 'Erro desconhecido'}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao tentar excluir o orçamento.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ORCAMENTO':
        return <Badge variant="outline">Orçamento</Badge>;
      case 'PROPOSTA_GERADA':
        return <Badge variant="secondary">Proposta</Badge>;
      case 'EM_VERIFICACAO':
        return <Badge variant="outline" className="bg-yellow-100">Em verificação</Badge>;
      case 'APROVADA':
        return <Badge variant="success">Aprovada</Badge>;
      case 'CONTRATO_GERADO':
        return <Badge variant="outline" className="bg-blue-100">Contrato</Badge>;
      case 'ASSINATURA_CLIENTE':
        return <Badge variant="outline" className="bg-indigo-100">Assinatura Cliente</Badge>;
      case 'ASSINATURA_DIRETORIA':
        return <Badge variant="outline" className="bg-purple-100">Assinatura Diretoria</Badge>;
      case 'AGENDAMENTO_ENTREGA':
        return <Badge variant="outline" className="bg-pink-100">Entrega Agendada</Badge>;
      case 'ENTREGA':
        return <Badge variant="outline" className="bg-green-100">Em entrega</Badge>;
      case 'CONCLUIDO':
        return <Badge variant="primary">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!quotes || quotes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum orçamento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableCaption>Listagem de orçamentos</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Cliente</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.clientName || "Cliente não especificado"}</TableCell>
              <TableCell>{quote.vehicleName || "Veículo não especificado"}</TableCell>
              <TableCell>{formatValue(quote.value)}</TableCell>
              <TableCell>{formatDate(quote.createdAt)}</TableCell>
              <TableCell>{getStatusBadge(quote.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link to={`/orcamento/${quote.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  {canModifyQuote(quote.createdBy) && (
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/editar-orcamento/${quote.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  
                  {canModifyQuote(quote.createdBy) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este orçamento? Esta ação não poderá ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(quote.id)}
                            disabled={isDeleting && deletingId === quote.id}
                          >
                            {isDeleting && deletingId === quote.id ? 'Excluindo...' : 'Excluir'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
