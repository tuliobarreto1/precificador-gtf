
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowLeft, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

import { getQuoteByIdFromSupabase, deleteQuoteFromSupabase } from '@/integrations/supabase';
import { Quote } from '@/lib/models';
import StatusHistory from '@/components/status/StatusHistory';
import StatusFlow from '@/components/status/StatusFlow';
import { useQuote } from '@/context/QuoteContext';

// Componente EmailDialog
const EmailDialog = ({ quoteId }: { quoteId: string }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { sendQuoteByEmail, sendingEmail } = useQuote();

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "E-mail obrigatório",
        description: "Digite o e-mail do destinatário",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await sendQuoteByEmail(quoteId, email, message);
      
      if (success) {
        toast({
          title: "E-mail enviado",
          description: "Orçamento enviado com sucesso"
        });
        setDialogOpen(false);
        setEmail('');
        setMessage('');
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar o e-mail. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar enviar o e-mail.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Mail size={16} />
          <span>Enviar por E-mail</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Orçamento por E-mail</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com.br"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Segue em anexo o orçamento conforme solicitado."
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={sendingEmail}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSendEmail} 
            disabled={sendingEmail}
            className="flex items-center gap-2"
          >
            {sendingEmail ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Mail size={14} />
                <span>Enviar</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Interface ampliada para lidar com a estrutura do Supabase
interface SupabaseQuote extends Omit<Quote, 'vehicles'> {
  title?: string;
  name?: string;
  created_at: string;
  status_flow: string;
  monthly_values?: number;
  vehicles?: {
    vehicle_id: string;
    vehicle?: {
      brand: string;
      model: string;
      plate_number?: string;
    };
  }[];
}

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<SupabaseQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEditQuote, canDeleteQuote } = useQuote();

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError('ID do orçamento não fornecido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { quote: quoteData, error: quoteError } = await getQuoteByIdFromSupabase(id);

        if (quoteError) {
          setError(`Erro ao carregar orçamento: ${quoteError.message}`);
          console.error("Erro ao carregar orçamento:", quoteError);
          return;
        }

        if (!quoteData) {
          setError('Orçamento não encontrado.');
          return;
        }

        setQuote(quoteData as SupabaseQuote);
      } catch (err: any) {
        setError(`Erro inesperado: ${err.message}`);
        console.error("Erro inesperado:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const handleDeleteQuote = async () => {
    try {
      if (!id) return;
      
      const { success, error: deleteError } = await deleteQuoteFromSupabase(id);
      if (success) {
        toast({
          title: "Orçamento excluído",
          description: "O orçamento foi excluído com sucesso.",
        });
        navigate('/orcamentos');
      } else {
        toast({
          title: "Erro ao excluir",
          description: deleteError?.message || "Ocorreu um erro ao excluir o orçamento.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro inesperado",
        description: err.message || "Ocorreu um erro inesperado ao excluir o orçamento.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
    }
  };

  const handleEditQuote = () => {
    navigate(`/editar-orcamento/${id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-8">
          <PageTitle title="Detalhes do Orçamento" subtitle="Carregando informações..." />
          <Card>
            <div className="flex items-center justify-center h-48">
              <span className="loading loading-dots loading-lg"></span>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="py-8">
          <PageTitle title="Detalhes do Orçamento" subtitle="Erro ao carregar informações" />
          <Card>
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!quote) {
    return (
      <MainLayout>
        <div className="py-8">
          <PageTitle title="Detalhes do Orçamento" subtitle="Orçamento não encontrado" />
          <Card>
            <Alert variant="destructive">
              <AlertTitle>Aviso</AlertTitle>
              <AlertDescription>Orçamento não encontrado.</AlertDescription>
            </Alert>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex items-center justify-between mb-4">
          <PageTitle title="Detalhes do Orçamento" subtitle="Visualize e gerencie os detalhes do orçamento" />
          <Button variant="ghost" onClick={() => navigate('/orcamentos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Informações do Orçamento</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Título:</span> {quote.name || quote.title}
                </div>
                <div>
                  <span className="font-semibold">ID:</span> {quote.id}
                </div>
                <div>
                  <span className="font-semibold">Cliente:</span> {quote.client?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Criado em:</span>{' '}
                  {format(new Date(quote.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{' '}
                  <Badge variant="secondary">{quote.status_flow}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Valor Mensal:</span> R$ {quote.monthly_values?.toLocaleString('pt-BR') || '0,00'}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Veículos</h2>
              {quote.vehicles && quote.vehicles.length > 0 ? (
                <ul className="list-disc pl-5">
                  {quote.vehicles.map((vehicle) => (
                    <li key={vehicle.vehicle_id}>
                      {vehicle.vehicle?.brand} {vehicle.vehicle?.model} ({vehicle.vehicle?.plate_number || 'N/A'})
                    </li>
                  ))}
                </ul>
              ) : (
                <div>Nenhum veículo associado a este orçamento.</div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Histórico de Status</h2>
            <StatusHistory quoteId={quote.id} />
          </div>

          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Alterar Status</h2>
            <StatusFlow quoteId={quote.id} currentStatus={quote.status_flow} />
          </div>

          <div className="flex items-center space-x-2 mt-6 border-t pt-4">
            {canEditQuote && (
              <Button variant="outline" onClick={handleEditQuote}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
            )}
            
            {canDeleteQuote && (
              <Button variant="destructive" onClick={() => setShowDeleteAlert(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            )}
            
            {quote && <EmailDialog quoteId={quote.id} />}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Alert */}
      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDeleteAlert(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteQuote}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default QuoteDetail;
