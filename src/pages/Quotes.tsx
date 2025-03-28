import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, Filter, RotateCcw, Search } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/ui-custom/StatsCard';
import { quotes, getClientById, getVehicleById } from '@/lib/mock-data';
import { useQuote } from '@/context/QuoteContext';
import { supabase, checkSupabaseConnection, getQuotesFromSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/status/StatusBadge';
import { QuoteStatusFlow } from '@/lib/status-flow';

const Quotes = () => {
  const [loading, setLoading] = useState(false);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseQuotes, setSupabaseQuotes] = useState<any[]>([]);
  
  const { savedQuotes } = useQuote();
  const { toast } = useToast();
  
  // Verificar conexão com o Supabase e carregar orçamentos
  useEffect(() => {
    console.log('Componente Quotes montado, verificando conexão e carregando orçamentos');
    
    const checkConnection = async () => {
      try {
        setLoadingSupabase(true);
        console.log('Verificando conexão com o Supabase...');
        
        const { success } = await checkSupabaseConnection();
        
        if (success) {
          console.log('Conexão com o Supabase estabelecida com sucesso');
          setSupabaseConnected(true);
          loadSupabaseQuotes();
        } else {
          console.error('Falha ao conectar ao Supabase');
          setSupabaseConnected(false);
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setSupabaseConnected(false);
      } finally {
        setLoadingSupabase(false);
      }
    };
    
    checkConnection();
  }, []);
  
  const loadSupabaseQuotes = async () => {
    try {
      console.log('Iniciando carregamento de orçamentos do Supabase...');
      const { quotes: data, success, error } = await getQuotesFromSupabase();
      
      if (success && data) {
        console.log(`Carregados ${data.length} orçamentos do Supabase com sucesso`);
        setSupabaseQuotes(data);
      } else {
        console.error('Erro ao carregar orçamentos do Supabase:', error);
        setError('Falha ao carregar orçamentos do Supabase');
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar orçamentos do Supabase:', error);
      setError('Erro inesperado ao carregar orçamentos');
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    loadSupabaseQuotes();
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Lista atualizada",
        description: "A lista de orçamentos foi atualizada com sucesso."
      });
    }, 1000);
  };
  
  // Combinar orçamentos locais (mock) e do Supabase
  const allQuotes = [
    ...quotes.map(quote => ({
      id: quote.id,
      clientName: getClientById(quote.clientId)?.name || 'Cliente não encontrado',
      vehicleName: getVehicleById(quote.vehicleId)?.brand + ' ' + getVehicleById(quote.vehicleId)?.model,
      value: quote.totalCost,
      createdAt: new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'mock'
    })),
    ...(savedQuotes || []).map(quote => ({
      id: quote.id,
      clientName: quote.clientName,
      vehicleName: quote.vehicles && quote.vehicles.length > 0 ? 
        `${quote.vehicles[0].vehicleBrand} ${quote.vehicles[0].vehicleModel}` : 
        'Veículo não especificado',
      value: quote.totalCost,
      createdAt: quote.createdAt || new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'local'
    })),
    ...supabaseQuotes.map(quote => ({
      id: quote.id,
      clientName: quote.client?.name || 'Cliente não encontrado',
      vehicleName: quote.items && quote.items.length > 0 && quote.items[0].vehicle ? 
        `${quote.items[0].vehicle.brand} ${quote.items[0].vehicle.model}` : 
        'Veículo não especificado',
      value: quote.total_value || 0,
      createdAt: quote.created_at,
      status: quote.status_flow || 'ORCAMENTO',
      source: 'supabase'
    }))
  ];
  
  // Ordenar por data de criação (mais recente primeiro)
  allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Estatísticas básicas
  const totalQuotes = allQuotes.length;
  const totalValue = allQuotes.reduce((sum, quote) => sum + Number(quote.value), 0);
  const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
  
  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <PageTitle 
            title="Orçamentos" 
            subtitle="Gerencie todos os seus orçamentos"
          />
          <Link to="/orcamento/novo">
            <Button className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard 
            title="Total de Orçamentos"
            value={totalQuotes.toString()}
            icon="FileText"
          />
          <StatsCard 
            title="Valor Médio"
            value={`R$ ${avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="DollarSign"
          />
          <StatsCard 
            title="Valor Total"
            value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="Wallet"
          />
        </div>
        
        <div className="bg-white shadow rounded-md">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar orçamentos..."
                className="pl-8 h-10 w-full border rounded-md"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {allQuotes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum orçamento encontrado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Crie um novo orçamento para começar
              </p>
              <Link to="/orcamento/novo">
                <Button className="mt-4">
                  Criar Orçamento
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Veículo</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fonte</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuotes.map((quote, index) => (
                    <tr key={`${quote.source}-${quote.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                      <td className="p-4 border-t">
                        <Link to={`/orcamento/${quote.id}`}>
                          <span className="font-medium hover:text-primary">
                            {quote.clientName}
                          </span>
                        </Link>
                      </td>
                      <td className="p-4 border-t">{quote.vehicleName}</td>
                      <td className="p-4 border-t">
                        R$ {Number(quote.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 border-t">
                        <StatusBadge status={quote.status as QuoteStatusFlow} size="sm" />
                      </td>
                      <td className="p-4 border-t">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          quote.source === 'supabase' ? 'bg-blue-50 text-blue-700' : 
                          quote.source === 'local' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                        }`}>
                          {quote.source === 'supabase' ? 'Supabase' : 
                           quote.source === 'local' ? 'Local' : 'Demo'}
                        </span>
                      </td>
                      <td className="p-4 border-t text-right">
                        <Link to={`/orcamento/${quote.id}`}>
                          <Button variant="link" size="sm">Ver detalhes</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Quotes;
