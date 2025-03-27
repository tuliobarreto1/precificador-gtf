import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Plus, FileText, Calendar, ArrowUp, ArrowDown
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { quotes as mockQuotes, Quote } from '@/lib/mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SavedQuote } from '@/context/QuoteContext';

// Type guard para diferenciar entre Quote (mock) e SavedQuote (localStorage)
function isSavedQuote(quote: SavedQuote | Quote): quote is SavedQuote {
  return 'vehicles' in quote;
}

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [quotes, setQuotes] = useState<(SavedQuote | Quote)[]>([]);

  // Carregar orçamentos salvos do localStorage e do mock
  useEffect(() => {
    const savedQuotesString = localStorage.getItem('savedQuotes');
    let savedQuotes: SavedQuote[] = [];
    
    if (savedQuotesString) {
      try {
        savedQuotes = JSON.parse(savedQuotesString);
      } catch (error) {
        console.error('Erro ao carregar orçamentos salvos:', error);
      }
    }

    // Combinar orçamentos salvos e mockados
    setQuotes([...savedQuotes, ...mockQuotes]);
  }, []);

  // Função para ordenar orçamentos
  const sortQuotes = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrar e ordenar orçamentos
  const filteredQuotes = quotes
    .filter(quote => {
      const searchLower = searchTerm.toLowerCase();
      
      // Nome do cliente em ambos os tipos
      const clientName = isSavedQuote(quote) 
        ? quote.clientName.toLowerCase()
        : quote.clientName.toLowerCase();
      
      // Veículo em ambos os tipos
      const vehicleInfo = isSavedQuote(quote)
        ? `${quote.vehicleBrand} ${quote.vehicleModel}`.toLowerCase()
        : `${quote.vehicleBrand} ${quote.vehicleModel}`.toLowerCase();
      
      // ID em ambos os tipos
      const id = quote.id.toString().toLowerCase();
      
      return clientName.includes(searchLower) || 
             vehicleInfo.includes(searchLower) || 
             id.includes(searchLower);
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'date') {
        const dateA = isSavedQuote(a) ? new Date(a.createdAt) : new Date(a.createdAt);
        const dateB = isSavedQuote(b) ? new Date(b.createdAt) : new Date(b.createdAt);
        return (dateA.getTime() - dateB.getTime()) * direction;
      }
      
      if (sortField === 'client') {
        const clientA = isSavedQuote(a) ? a.clientName : a.clientName;
        const clientB = isSavedQuote(b) ? b.clientName : b.clientName;
        return clientA.localeCompare(clientB) * direction;
      }
      
      if (sortField === 'value') {
        const valueA = isSavedQuote(a) ? a.totalCost : a.totalCost;
        const valueB = isSavedQuote(b) ? b.totalCost : b.totalCost;
        return (valueA - valueB) * direction;
      }
      
      return 0;
    });

  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <PageTitle 
            title="Orçamentos" 
            subtitle="Gerencie todos os orçamentos" 
          />
          
          <Button asChild>
            <Link to="/novo-orcamento">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Link>
          </Button>
        </div>
        
        <Card>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Buscar orçamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => sortQuotes('date')}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Data
                      {sortField === 'date' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-3 w-3 ml-1" /> 
                          : <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => sortQuotes('client')}
                  >
                    <div className="flex items-center">
                      Cliente
                      {sortField === 'client' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-3 w-3 ml-1" /> 
                          : <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => sortQuotes('value')}
                  >
                    <div className="flex items-center justify-end">
                      Valor Mensal
                      {sortField === 'value' && (
                        sortDirection === 'asc' 
                          ? <ArrowUp className="h-3 w-3 ml-1" /> 
                          : <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground font-medium">Nenhum orçamento encontrado</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchTerm ? 'Tente modificar sua busca' : 'Crie um novo orçamento para começar'}
                        </p>
                        {!searchTerm && (
                          <Button asChild className="mt-4" variant="outline" size="sm">
                            <Link to="/novo-orcamento">
                              <Plus className="h-4 w-4 mr-2" />
                              Novo Orçamento
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => {
                    // Formatar a data
                    const formattedDate = isSavedQuote(quote)
                      ? format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: ptBR })
                      : format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: ptBR });
                    
                    // Obter prazo do contrato
                    const contractMonths = isSavedQuote(quote)
                      ? quote.contractMonths
                      : quote.contractMonths;
                    
                    // Obter valor
                    const value = isSavedQuote(quote)
                      ? quote.totalCost
                      : quote.totalCost;
                    
                    // Obter responsável
                    const responsible = isSavedQuote(quote)
                      ? quote.quoteResponsible || 'Não informado'
                      : 'Analista';

                    // Obter informações do veículo
                    const vehicleInfo = isSavedQuote(quote)
                      ? `${quote.vehicleBrand} ${quote.vehicleModel}`
                      : `${quote.vehicleBrand} ${quote.vehicleModel}`;
                    
                    // Contar veículos
                    const vehicleCount = isSavedQuote(quote)
                      ? quote.vehicles.length
                      : 1;
                    
                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">#{quote.id}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>
                          {isSavedQuote(quote) ? quote.clientName : quote.clientName}
                        </TableCell>
                        <TableCell>{responsible}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {vehicleInfo}
                            {vehicleCount > 1 && (
                              <Badge variant="outline" className="ml-2">
                                +{vehicleCount - 1}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{contractMonths} meses</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {value.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="icon">
                            <Link to={`/orcamentos/${quote.id}`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Quotes;
