
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
import { Edit, Trash2, Calendar, User } from 'lucide-react';
import { useQuote } from '@/context/QuoteContext';
import { User as UserType } from '@/context/types/quoteTypes';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName: string;
  value: number;
  createdAt: string;
  status: string;
  createdBy?: {
    id: number;
    name: string;
    role: string;
  };
}

interface QuoteTableProps {
  quotes: QuoteItem[];
  onRefresh?: () => void;
  onDeleteClick?: (quoteId: string) => void;
}

const QuoteTable = ({ quotes, onRefresh, onDeleteClick }: QuoteTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const quoteContext = useQuote();
  const { canEditQuote, canDeleteQuote, deleteQuote } = quoteContext || {};
  const { toast } = useToast();

  // Garantir que quotes é sempre um array
  const safeQuotes = Array.isArray(quotes) ? quotes : [];

  // Verificar se as funções necessárias estão disponíveis
  const isQuoteContextAvailable = typeof canEditQuote === 'function' && 
                                 typeof canDeleteQuote === 'function' &&
                                 typeof deleteQuote === 'function';

  const handleDeleteClick = (quoteId: string) => {
    // Se temos uma função de delete externa, usar ela
    if (onDeleteClick) {
      onDeleteClick(quoteId);
      return;
    }
    
    // Caso contrário, usar o fluxo interno
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (quoteToDelete && isQuoteContextAvailable) {
      const success = await deleteQuote(quoteToDelete);
      if (success) {
        toast({
          title: "Orçamento excluído",
          description: "O orçamento foi excluído com sucesso."
        });
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o orçamento.",
          variant: "destructive"
        });
      }
    }
    setDeleteDialogOpen(false);
    setQuoteToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuoteToDelete(null);
  };

  // Validar status antes de passar para o componente StatusBadge
  const validateStatus = (status: string): QuoteStatusFlow => {
    // Lista dos status válidos (os que estão definidos em statusInfo)
    const validStatuses: QuoteStatusFlow[] = [
      'ORCAMENTO', 'PROPOSTA_GERADA', 'EM_VERIFICACAO', 'APROVADA',
      'CONTRATO_GERADO', 'ASSINATURA_CLIENTE', 'ASSINATURA_DIRETORIA',
      'AGENDAMENTO_ENTREGA', 'ENTREGA', 'CONCLUIDO', 'draft'
    ];
    
    // Verificar se o status está na lista de status válidos
    if (validStatuses.includes(status as QuoteStatusFlow)) {
      return status as QuoteStatusFlow;
    }
    
    // Status padrão para valores inválidos
    console.warn(`Status inválido detectado: ${status}. Usando 'ORCAMENTO' como fallback.`);
    return 'ORCAMENTO';
  };
  
  // Função para formatar a data no formato brasileiro
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
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
              <TableHead>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Data/Hora</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Criado por</span>
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Nenhum orçamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              safeQuotes.map((quote) => {
                // Converter o objeto quote para um formato compatível com as funções canEditQuote e canDeleteQuote
                const quoteForPermissionCheck = {
                  id: quote.id,
                  clientId: '',
                  clientName: quote.clientName || '',
                  vehicleId: '',
                  vehicleBrand: '',
                  vehicleModel: '',
                  contractMonths: 0,
                  monthlyKm: 0,
                  totalCost: quote.value || 0,
                  createdAt: quote.createdAt || '',
                  createdBy: quote.createdBy ? {
                    id: quote.createdBy.id,
                    name: quote.createdBy.name,
                    role: quote.createdBy.role as any,
                    email: '',
                    status: 'active' as 'active' | 'inactive',
                    lastLogin: ''
                  } : undefined,
                  vehicles: [],
                  status: quote.status || 'ORCAMENTO'
                };
                
                // Valores padrão caso o contexto não esteja disponível
                let canEdit = true; // Por padrão, permitir edição
                let canDelete = true; // Por padrão, permitir exclusão
                
                if (isQuoteContextAvailable) {
                  canEdit = canEditQuote(quoteForPermissionCheck);
                  canDelete = canDeleteQuote(quoteForPermissionCheck);
                }
                
                const isEditable = quote.status === 'ORCAMENTO' || quote.status === 'draft';
                
                // Validar o status antes de passar para o StatusBadge
                const validatedStatus = validateStatus(quote.status || 'ORCAMENTO');
                
                return (
                  <TableRow key={quote.id}>
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
                      <StatusBadge status={validatedStatus} size="sm" />
                    </TableCell>
                    <TableCell>
                      {formatDate(quote.createdAt)}
                    </TableCell>
                    <TableCell>
                      {quote.createdBy?.name || "Sistema"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Link to={`/orcamento/${quote.id}`}>
                        <Button variant="link" size="sm">Ver</Button>
                      </Link>
                      
                      {canEdit && isEditable && (
                        <Link to={`/editar-orcamento/${quote.id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      
                      {canDelete && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(quote.id)}
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuoteTable;
