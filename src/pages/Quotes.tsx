import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, Filter } from 'lucide-react';
import Card from '@/components/ui-custom/Card';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuote } from '@/context/QuoteContext';
import { SavedQuote, QuoteItem } from '@/context/types/quoteTypes';
import StatusBadge from '@/components/status/StatusBadge';
import { QuoteStatusFlow } from '@/lib/status-flow';

const Quotes = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const quoteContext = useQuote();
  const { savedQuotes } = quoteContext || {};

  useEffect(() => {
    if (savedQuotes) {
      const mappedQuotes: QuoteItem[] = savedQuotes.map(quote => ({
        id: quote.id,
        clientName: quote.clientName,
        vehicleName: quote.vehicles.map(v => `${v.vehicleBrand} ${v.vehicleModel}`).join(', '),
        value: quote.totalValue,
        status: quote.status,
        createdAt: quote.createdAt,
        createdBy: quote.createdBy
      }));
      setQuotes(mappedQuotes);
      setLoading(false);
    }
  }, [savedQuotes]);

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
    setLoading(true);
    // You might want to refetch quotes here
    setLoading(false);
  };

  const handleDeleteClick = (quoteId: string) => {
    // Implement your delete logic here
    console.log(`Delete clicked for quote ID: ${quoteId}`);
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
              {/* Adicione mais status conforme necessário */}
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
              {/* Conteúdo específico para o status "ORCAMENTO" */}
            </TabsContent>
            <TabsContent value="PROPOSTA_GERADA">
              {/* Conteúdo específico para o status "PROPOSTA_GERADA" */}
            </TabsContent>
            <TabsContent value="EM_VERIFICACAO">
              {/* Conteúdo específico para o status "EM_VERIFICACAO" */}
            </TabsContent>
            <TabsContent value="APROVADA">
              {/* Conteúdo específico para o status "APROVADA" */}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Quotes;
