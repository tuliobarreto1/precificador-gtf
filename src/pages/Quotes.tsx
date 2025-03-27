import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Calendar, ArrowUpDown, User } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quotes, getClientById, getVehicleById } from '@/lib/mock-data';
import { SavedQuote, useQuote, mockUsers } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';

// Type guard para determinar se um objeto é um SavedQuote
const isSavedQuote = (quote: any): quote is SavedQuote => {
  return 'clientName' in quote && 'vehicleBrand' in quote && 'vehicleModel' in quote;
};

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'value'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [userFilter, setUserFilter] = useState<string>('all');
  const { toast } = useToast();
  const { getSavedQuotes } = useQuote();
  
  // Carregar orçamentos salvos
  useEffect(() => {
    try {
      const quotes = getSavedQuotes();
      setSavedQuotes(quotes);
      console.log('Orçamentos carregados:', quotes);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Não foi possível carregar os orçamentos salvos.",
        variant: "destructive",
      });
    }
  }, [getSavedQuotes, toast]);
  
  // Combinar os orçamentos mockados com os salvos
  const allQuotes = [...savedQuotes, ...quotes];
  console.log('Total de orçamentos combinados:', allQuotes.length);
  
  // Lista de usuários disponíveis para filtro
  const availableUsers = [
    { id: 'all', name: 'Todos os usuários' },
    ...mockUsers
  ];
  
  // Filter and sort quotes
  const filteredQuotes = allQuotes
    .filter(quote => {
      // Filtrar por usuário
      if (userFilter !== 'all' && isSavedQuote(quote)) {
        if (!quote.createdBy || quote.createdBy.id !== userFilter) {
          return false;
        }
      }
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Usar type guard para distinguir entre tipos de orçamentos
      if (isSavedQuote(quote)) {
        // Para orçamentos salvos
        return (
          quote.clientName.toLowerCase().includes(searchLower) ||
          quote.vehicleBrand.toLowerCase().includes(searchLower) ||
          quote.vehicleModel.toLowerCase().includes(searchLower) ||
          `${quote.contractMonths} meses`.includes(searchLower) ||
          `${quote.monthlyKm} km`.includes(searchLower) ||
          (quote.createdBy && quote.createdBy.name.toLowerCase().includes(searchLower))
        );
      } else {
        // Para orçamentos mockados
        const client = getClientById(quote.clientId);
        const vehicle = getVehicleById(quote.vehicleId);
        
        return (
          (client?.name.toLowerCase().includes(searchLower) || false) ||
          (vehicle?.model.toLowerCase().includes(searchLower) || false) ||
          (vehicle?.brand.toLowerCase().includes(searchLower) || false) ||
          `${quote.contractMonths} meses`.includes(searchLower) ||
          `${quote.monthlyKm} km`.includes(searchLower)
        );
      }
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'desc'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return sortDirection === 'desc'
          ? b.totalCost - a.totalCost
          : a.totalCost - b.totalCost;
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
          
          <Link to="/orcamento/novo">
            <Button className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
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
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtrar por usuário:</span>
              </div>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="h-9 min-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
        
        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            filteredQuotes.map(quote => {
              // Renderização baseada no tipo de orçamento
              return (
                <Link key={quote.id} to={`/orcamento/${quote.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        
                        <div>
                          <h3 className="font-medium">Orçamento #{quote.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {isSavedQuote(quote) 
                              ? quote.clientName 
                              : getClientById(quote.clientId)?.name} • {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          
                          {/* Exibir o criador se for um orçamento salvo */}
                          {isSavedQuote(quote) && quote.createdBy && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              <span>Criado por: </span>
                              <span className="font-medium ml-1">{quote.createdBy.name}</span>
                              {quote.createdBy.role !== 'user' && (
                                <span className="ml-1 px-1.5 py-0.5 bg-muted/50 rounded-full text-xs">
                                  {quote.createdBy.role === 'manager' ? 'Gerente' : 'Admin'}
                                </span>
                              )}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Veículo:</span>{' '}
                              {isSavedQuote(quote)
                                ? `${quote.vehicleBrand} ${quote.vehicleModel}`
                                : `${getVehicleById(quote.vehicleId)?.brand} ${getVehicleById(quote.vehicleId)?.model}`
                              }
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Prazo:</span>{' '}
                              {quote.contractMonths} meses
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Km:</span>{' '}
                              {quote.monthlyKm}/mês
                            </p>
                            
                            {isSavedQuote(quote) && quote.vehicles && quote.vehicles.length > 1 && (
                              <p className="text-sm bg-primary/10 px-2 py-0.5 rounded-full text-primary font-medium">
                                {quote.vehicles.length} veículos
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:text-right">
                        <p className="text-lg font-semibold">
                          R$ {quote.totalCost.toLocaleString('pt-BR')}
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
