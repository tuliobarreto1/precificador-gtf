
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Calendar, ArrowUpDown, User, RefreshCw } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getQuotesFromSupabase } from '@/integrations/supabase/client';

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'value'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Função para carregar orçamentos
  const loadQuotes = async () => {
    setIsLoading(true);
    try {
      const { success, quotes, error } = await getQuotesFromSupabase();
      
      if (success && quotes) {
        console.log('Orçamentos carregados do Supabase:', quotes);
        setQuotes(quotes);
      } else {
        console.error('Erro ao carregar orçamentos:', error);
        toast({
          title: "Erro ao carregar orçamentos",
          description: "Não foi possível carregar os orçamentos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Não foi possível carregar os orçamentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar orçamentos ao montar o componente
  useEffect(() => {
    console.log("Componente Quotes montado, carregando orçamentos");
    loadQuotes();
  }, []);
  
  // Filtrar e ordenar orçamentos
  const filteredQuotes = quotes.filter(quote => {
    // Filtrar por usuário
    if (userFilter !== 'all' && quote.created_by !== userFilter) {
      return false;
    }
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Filtrar por vários campos
    return (
      // Cliente
      (quote.client?.name && quote.client.name.toLowerCase().includes(searchLower)) ||
      // Título do orçamento
      quote.title.toLowerCase().includes(searchLower) ||
      // Itens (veículos)
      (quote.items && quote.items.some(item => 
        item.vehicle && 
        (
          (item.vehicle.brand && item.vehicle.brand.toLowerCase().includes(searchLower)) ||
          (item.vehicle.model && item.vehicle.model.toLowerCase().includes(searchLower))
        )
      )) ||
      // Outros campos
      `${quote.contract_months} meses`.includes(searchLower) ||
      `${quote.monthly_km} km`.includes(searchLower)
    );
  }).sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'desc'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      return sortDirection === 'desc'
        ? b.total_value - a.total_value
        : a.total_value - b.total_value;
    }
  });
  
  // Toggle sort
  const toggleSort = (field: 'date' | 'value') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <PageTitle 
            title="Orçamentos" 
            subtitle="Gerencie todos os seus orçamentos" 
            className="mb-4 sm:mb-0"
          />
          
          <div className="flex items-center gap-4">
            <Link to="/orcamento/novo">
              <Button className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Button>
            </Link>
          </div>
        </div>
        
        <Card className="mb-6">
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar orçamentos..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleSort('date')}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  Data
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleSort('value')}
                  className="flex items-center gap-1"
                >
                  R$
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={loadQuotes}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 border rounded-lg">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Carregando orçamentos...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={loadQuotes}
                  className="mx-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          ) : (
            filteredQuotes.map(quote => {
              // Obter o primeiro veículo do orçamento para exibição
              const firstVehicle = quote.items && quote.items.length > 0 && quote.items[0].vehicle
                ? quote.items[0].vehicle
                : null;
              
              return (
                <Link key={quote.id} to={`/orcamento/${quote.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{quote.title || `Orçamento #${quote.id.substring(0, 8)}`}</h3>
                          <p className="text-sm text-muted-foreground">
                            {quote.client?.name || 'Cliente não especificado'} • {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            {firstVehicle && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Veículo:</span>{' '}
                                {`${firstVehicle.brand} ${firstVehicle.model}`}
                              </p>
                            )}
                            <p className="text-sm">
                              <span className="text-muted-foreground">Prazo:</span>{' '}
                              {quote.contract_months} meses
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Km:</span>{' '}
                              {quote.monthly_km}/mês
                            </p>
                            
                            {quote.items && quote.items.length > 1 && (
                              <p className="text-sm bg-primary/10 px-2 py-0.5 rounded-full text-primary font-medium">
                                {quote.items.length} veículos
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:text-right">
                        <p className="text-lg font-semibold">
                          R$ {Number(quote.total_value).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground">por mês</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Quotes;
