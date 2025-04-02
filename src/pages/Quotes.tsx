
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, RefreshCw, ClipboardList } from 'lucide-react';
import { QuoteTable } from '@/components/Quote/QuoteTable';
import { useQuotes } from '@/hooks/useQuotes';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { getQuoteActionLogs } from '@/integrations/supabase';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const { allQuotes, totalQuotes, avgValue, handleRefresh, loading } = useQuotes();
  const { isAdmin, isSupervisor } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuotes, setFilteredQuotes] = useState(allQuotes);
  const [activeTab, setActiveTab] = useState('orcamentos');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const filtered = allQuotes.filter(
      (quote) =>
        quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQuotes(filtered);
  }, [searchTerm, allQuotes]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleNewQuote = () => {
    navigate('/orcamento/novo');
  };

  // Carregar logs de ações quando a aba de logs for selecionada
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'logs' && (isAdmin || isSupervisor)) {
      loadActionLogs();
    }
  };
  
  const loadActionLogs = async () => {
    try {
      setLoadingLogs(true);
      const { success, logs: actionLogs } = await getQuoteActionLogs();
      
      if (success && actionLogs) {
        setLogs(actionLogs);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de ações:', error);
    } finally {
      setLoadingLogs(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
            <p className="text-muted-foreground">
              Gerencie seus orçamentos e acompanhe o progresso das propostas
            </p>
          </div>
          <Button onClick={handleNewQuote}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Visão geral dos seus orçamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-muted rounded-md p-4">
                <div className="text-muted-foreground mb-1 text-sm">Total de orçamentos</div>
                <div className="text-2xl font-bold">{totalQuotes}</div>
              </div>
              <div className="bg-muted rounded-md p-4">
                <div className="text-muted-foreground mb-1 text-sm">Valor médio</div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(avgValue)}
                </div>
              </div>
              <div className="bg-muted rounded-md p-4">
                <div className="text-muted-foreground mb-1 text-sm">Valor total</div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    allQuotes.reduce((sum, quote) => sum + Number(quote.value), 0)
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="orcamentos">
              Orçamentos
            </TabsTrigger>
            {(isAdmin || isSupervisor) && (
              <TabsTrigger value="logs">
                <ClipboardList className="h-4 w-4 mr-2" />
                Logs de Ações
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="orcamentos">
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por cliente ou veículo..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            <QuoteTable 
              quotes={filteredQuotes} 
              loading={loading} 
              onDeleteQuote={() => handleRefresh()}
            />
          </TabsContent>
          
          {(isAdmin || isSupervisor) && (
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Ações</CardTitle>
                  <CardDescription>
                    Registro de edições e exclusões de orçamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLogs ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum registro de ação encontrado.
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>Histórico de ações em orçamentos</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data / Hora</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Orçamento</TableHead>
                          <TableHead>Usuário</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDate(log.action_date)}</TableCell>
                            <TableCell>
                              {log.action_type === 'EDIT' ? 'Edição' : 'Exclusão'}
                            </TableCell>
                            <TableCell>{log.quote_title}</TableCell>
                            <TableCell>{log.user_name || 'Usuário desconhecido'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Quotes;
