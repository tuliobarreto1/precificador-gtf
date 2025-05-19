
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, RefreshCw } from 'lucide-react';
import Card from '@/components/ui-custom/Card';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotesDataFetching } from '@/hooks/useQuotesDataFetching';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuoteItem } from '@/context/types/quoteTypes';

const Quotes = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { quotes, loading, error, handleRefresh } = useQuotesDataFetching();

  // Gerenciar busca e filtro de orçamentos
  const filteredQuotes = React.useMemo(() => {
    let filtered = quotes || [];

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
        handleRefresh();
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

  // Mostrar mensagem de erro se ocorrer
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar orçamentos",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

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
          <div className="flex items-center space-x-2 w-full md:w-auto">
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

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
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
            <TabsList className="overflow-x-auto flex-nowrap">
              <TabsTrigger value="all" onClick={() => setActiveTab('all')}>Todos</TabsTrigger>
              <TabsTrigger value="ORCAMENTO" onClick={() => setActiveTab('ORCAMENTO')}>Orçamento</TabsTrigger>
              <TabsTrigger value="PROPOSTA_GERADA" onClick={() => setActiveTab('PROPOSTA_GERADA')}>Proposta Gerada</TabsTrigger>
              <TabsTrigger value="EM_VERIFICACAO" onClick={() => setActiveTab('EM_VERIFICACAO')}>Em Verificação</TabsTrigger>
              <TabsTrigger value="APROVADA" onClick={() => setActiveTab('APROVADA')}>Aprovada</TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Carregando orçamentos...</p>
                <div className="mt-4 flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchTerm || activeTab !== 'all' 
                    ? "Nenhum orçamento encontrado com os filtros atuais"
                    : "Nenhum orçamento cadastrado ainda"}
                </p>
                <div className="mt-4">
                  <Button onClick={() => navigate('/orcamento/novo')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar novo orçamento
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-2">
                  <QuoteTable
                    quotes={filteredQuotes}
                    onRefresh={handleRefresh}
                    onDeleteClick={handleDeleteClick}
                  />
                </TabsContent>
                <TabsContent value="ORCAMENTO">
                  <QuoteTable
                    quotes={filteredQuotes.filter(q => q.status === 'ORCAMENTO')}
                    onRefresh={handleRefresh}
                    onDeleteClick={handleDeleteClick}
                  />
                </TabsContent>
                <TabsContent value="PROPOSTA_GERADA">
                  <QuoteTable
                    quotes={filteredQuotes.filter(q => q.status === 'PROPOSTA_GERADA')}
                    onRefresh={handleRefresh}
                    onDeleteClick={handleDeleteClick}
                  />
                </TabsContent>
                <TabsContent value="EM_VERIFICACAO">
                  <QuoteTable
                    quotes={filteredQuotes.filter(q => q.status === 'EM_VERIFICACAO')}
                    onRefresh={handleRefresh}
                    onDeleteClick={handleDeleteClick}
                  />
                </TabsContent>
                <TabsContent value="APROVADA">
                  <QuoteTable
                    quotes={filteredQuotes.filter(q => q.status === 'APROVADA')}
                    onRefresh={handleRefresh}
                    onDeleteClick={handleDeleteClick}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Quotes;
