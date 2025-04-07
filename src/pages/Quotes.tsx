
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter } from 'lucide-react';
import Card from '@/components/ui-custom/Card';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuote } from '@/context/QuoteContext';
import { QuoteItem } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Quotes = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          client_id,
          total_value,
          created_at,
          status,
          status_flow,
          contract_months,
          clients (
            id,
            name
          ),
          quote_vehicles (
            *,
            vehicle_id,
            vehicles:vehicle_id (
              brand,
              model
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar orçamentos:", error);
        toast({
          title: "Erro ao carregar orçamentos",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Orçamentos carregados:", data);
        
        // Mapear para o formato esperado pelo componente QuoteTable
        const mappedQuotes: QuoteItem[] = (data || []).map(quote => ({
          id: quote.id,
          clientName: quote.clients?.name || "Cliente não especificado",
          vehicleName: quote.quote_vehicles && quote.quote_vehicles[0]?.vehicles
            ? `${quote.quote_vehicles[0].vehicles.brand} ${quote.quote_vehicles[0].vehicles.model}`
            : "Veículo não especificado",
          value: quote.total_value || 0,
          status: quote.status_flow || quote.status || "draft",
          createdAt: quote.created_at || new Date().toISOString(),
          contractMonths: quote.contract_months || 24,
          createdBy: {
            id: "system",
            name: "Sistema",
            email: "system@example.com",
            role: "system",
            status: "active"
          }
        }));
        
        setQuotes(mappedQuotes);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredQuotes = React.useMemo(() => {
    let filtered = quotes;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(quote =>
        quote.clientName.toLowerCase().includes(lowerSearchTerm) ||
        (quote.vehicleName && quote.vehicleName.toLowerCase().includes(lowerSearchTerm)) ||
        quote.id.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(quote => quote.status === activeTab);
    }

    return filtered;
  }, [quotes, searchTerm, activeTab]);

  const handleRefresh = () => {
    fetchQuotes();
  };

  const handleDeleteClick = async (quoteId: string) => {
    try {
      const { success, error } = await import('@/integrations/supabase/services/quotes').then(
        module => module.deleteQuoteFromSupabase(quoteId)
      );
      
      if (success) {
        toast({
          title: "Orçamento excluído",
          description: "O orçamento foi excluído com sucesso"
        });
        fetchQuotes();
      } else {
        toast({
          title: "Erro ao excluir",
          description: error?.message || "Não foi possível excluir o orçamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao tentar excluir o orçamento",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <PageTitle
        title="Orçamentos"
        subtitle="Gerencie seus orçamentos e acompanhe as negociações"
        breadcrumbs={[
          { label: "Home", url: "/" },
          { label: "Orçamentos", url: "/orcamentos" }
        ]}
      />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Buscar orçamentos..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="md:w-80"
            />
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button onClick={() => navigate('/orcamento/novo')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </div>
        </div>

        <Card>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setActiveTab('all')}>Todos</TabsTrigger>
              <TabsTrigger value="ORCAMENTO" onClick={() => setActiveTab('ORCAMENTO')}>Orçamento</TabsTrigger>
              <TabsTrigger value="PROPOSTA_GERADA" onClick={() => setActiveTab('PROPOSTA_GERADA')}>Proposta Gerada</TabsTrigger>
              <TabsTrigger value="EM_VERIFICACAO" onClick={() => setActiveTab('EM_VERIFICACAO')}>Em Verificação</TabsTrigger>
              <TabsTrigger value="APROVADA" onClick={() => setActiveTab('APROVADA')}>Aprovada</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-2">
              {loading ? (
                <p>Carregando orçamentos...</p>
              ) : (
                <QuoteTable
                  quotes={filteredQuotes}
                  onRefresh={handleRefresh}
                  onDeleteClick={handleDeleteClick}
                />
              )}
            </TabsContent>
            <TabsContent value="ORCAMENTO">
              {loading ? (
                <p>Carregando orçamentos...</p>
              ) : (
                <QuoteTable
                  quotes={filteredQuotes.filter(q => q.status === 'ORCAMENTO')}
                  onRefresh={handleRefresh}
                  onDeleteClick={handleDeleteClick}
                />
              )}
            </TabsContent>
            <TabsContent value="PROPOSTA_GERADA">
              {loading ? (
                <p>Carregando orçamentos...</p>
              ) : (
                <QuoteTable
                  quotes={filteredQuotes.filter(q => q.status === 'PROPOSTA_GERADA')}
                  onRefresh={handleRefresh}
                  onDeleteClick={handleDeleteClick}
                />
              )}
            </TabsContent>
            <TabsContent value="EM_VERIFICACAO">
              {loading ? (
                <p>Carregando orçamentos...</p>
              ) : (
                <QuoteTable
                  quotes={filteredQuotes.filter(q => q.status === 'EM_VERIFICACAO')}
                  onRefresh={handleRefresh}
                  onDeleteClick={handleDeleteClick}
                />
              )}
            </TabsContent>
            <TabsContent value="APROVADA">
              {loading ? (
                <p>Carregando orçamentos...</p>
              ) : (
                <QuoteTable
                  quotes={filteredQuotes.filter(q => q.status === 'APROVADA')}
                  onRefresh={handleRefresh}
                  onDeleteClick={handleDeleteClick}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Quotes;
