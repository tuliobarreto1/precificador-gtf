
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { quotes, getClientById, getVehicleById } from '@/lib/mock-data';
import { SavedQuote } from '@/context/QuoteContext';

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'value'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  
  // Carregar orçamentos salvos do localStorage
  useEffect(() => {
    const storedQuotes = localStorage.getItem('savedQuotes');
    if (storedQuotes) {
      try {
        const parsedQuotes = JSON.parse(storedQuotes);
        setSavedQuotes(parsedQuotes);
      } catch (error) {
        console.error('Erro ao carregar orçamentos salvos:', error);
      }
    }
  }, []);
  
  // Combinar os orçamentos mockados com os salvos
  const allQuotes = [...savedQuotes, ...quotes];
  
  // Filter and sort quotes
  const filteredQuotes = allQuotes
    .filter(quote => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Para orçamentos mockados
      if ('clientId' in quote && typeof quote.clientId === 'string') {
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
      
      // Para orçamentos salvos
      return (
        quote.clientName.toLowerCase().includes(searchLower) ||
        quote.vehicleBrand.toLowerCase().includes(searchLower) ||
        quote.vehicleModel.toLowerCase().includes(searchLower) ||
        `${quote.contractMonths} meses`.includes(searchLower) ||
        `${quote.monthlyKm} km`.includes(searchLower)
      );
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
        </Card>
        
        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            filteredQuotes.map(quote => {
              // Renderização para orçamentos salvos
              return (
                <Link key={quote.id} to={`/orcamento/${quote.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        
                        <div>
                          <h3 className="font-medium">Orçamento #{quote.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {'clientName' in quote ? quote.clientName : getClientById(quote.clientId)?.name} • {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Veículo:</span>{' '}
                              {'vehicleBrand' in quote 
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
                            
                            {'vehicles' in quote && quote.vehicles.length > 1 && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Veículos:</span>{' '}
                                {quote.vehicles.length}
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
