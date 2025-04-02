
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from './Spinner';
import { QuoteStatusFlow } from '@/lib/status-flow';

interface StatusHistoryProps {
  quoteId: string;
}

interface StatusChange {
  id: string;
  quote_id: string;
  previous_status: QuoteStatusFlow | null;
  new_status: QuoteStatusFlow;
  changed_by: string;
  changed_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export const StatusHistory: React.FC<StatusHistoryProps> = ({ quoteId }) => {
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('quote_status_history')
          .select(`
            id,
            quote_id,
            previous_status,
            new_status,
            changed_by,
            changed_at,
            profiles (
              full_name,
              email
            )
          `)
          .eq('quote_id', quoteId)
          .order('changed_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar histórico de status:', error);
          setError('Não foi possível carregar o histórico de status.');
          return;
        }

        // Corrigindo o tipo do resultado para corresponder à StatusChange[]
        setStatusHistory(data as StatusChange[] || []);
      } catch (err) {
        console.error('Erro ao processar histórico de status:', err);
        setError('Ocorreu um erro ao processar os dados de histórico.');
      } finally {
        setLoading(false);
      }
    };

    if (quoteId) {
      fetchStatusHistory();
    }
  }, [quoteId]);

  const formatStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      'ORCAMENTO': 'Orçamento',
      'PROPOSTA_GERADA': 'Proposta Gerada',
      'EM_VERIFICACAO': 'Em Verificação',
      'APROVADA': 'Aprovada',
      'CONTRATO_GERADO': 'Contrato Gerado',
      'ASSINATURA_CLIENTE': 'Assinatura Cliente',
      'ASSINATURA_DIRETORIA': 'Assinatura Diretoria',
      'AGENDAMENTO_ENTREGA': 'Agendamento Entrega',
      'ENTREGA': 'Entrega Realizada',
      'CONCLUIDO': 'Concluído'
    };

    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (statusHistory.length === 0) {
    return <div className="text-muted-foreground italic p-4">Nenhuma alteração de status registrada.</div>;
  }

  return (
    <div className="space-y-4">
      {statusHistory.map((change) => (
        <div key={change.id} className="border rounded-md p-3 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                <span className="text-muted-foreground">De:</span> {change.previous_status ? formatStatusName(change.previous_status) : 'N/A'}
                <span className="mx-2">→</span>
                <span className="text-primary">{formatStatusName(change.new_status)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Por: {change.profiles?.full_name || change.profiles?.email || 'Usuário desconhecido'}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
              {format(new Date(change.changed_at), 'PPpp', { locale: ptBR })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusHistory;
