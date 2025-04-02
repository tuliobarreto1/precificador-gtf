import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { FileText, List, Settings, PieChart, TrendingUp, Clock, Calendar } from 'lucide-react';
import { getQuoteByIdFromSupabase } from '@/integrations/supabase/services/quotes';

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      if (!id) {
        setError("ID do orçamento não fornecido.");
        setLoading(false);
        return;
      }

      try {
        const { success, quote: fetchedQuote, error: fetchError } = await getQuoteByIdFromSupabase(id);

        if (success && fetchedQuote) {
          setQuote(fetchedQuote);
        } else {
          setError(fetchError?.message || "Erro ao carregar o orçamento.");
        }
      } catch (err) {
        setError("Erro inesperado ao carregar o orçamento.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Carregando detalhes do orçamento...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500">Erro: {error}</p>
        </div>
      </MainLayout>
    );
  }

  if (!quote) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Orçamento não encontrado.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle title="Detalhes do Orçamento" subtitle={`Orçamento #${quote.id}`} />

        <Card>
          <CardHeader title="Informações do Orçamento" />
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Título:</p>
                <p>{quote.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cliente:</p>
                <p>{quote.client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Data de Criação:</p>
                <p>{new Date(quote.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total:</p>
                <p>R$ {quote.total_value?.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Veículos no Orçamento" />
          <div className="p-4">
            {quote.vehicles && quote.vehicles.length > 0 ? (
              <ul className="list-disc pl-5">
                {quote.vehicles.map((vehicleItem: any) => (
                  <li key={vehicleItem.vehicle_id}>
                    {vehicleItem.vehicle?.brand} {vehicleItem.vehicle?.model} ({vehicleItem.vehicle?.plate_number || 'N/A'}) - R$ {vehicleItem.monthly_value?.toLocaleString('pt-BR')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum veículo adicionado a este orçamento.</p>
            )}
          </div>
        </Card>

        <div className="mt-4">
          <Link to="/orcamentos">
            <Button variant="outline">Voltar para a Lista de Orçamentos</Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteDetail;
