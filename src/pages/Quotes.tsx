
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import QuotesHeader from '@/components/quotes/QuotesHeader';
import QuoteStats from '@/components/quotes/QuoteStats';
import QuoteFilters from '@/components/quotes/QuoteFilters';
import QuoteEmpty from '@/components/quotes/QuoteEmpty';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/useQuotes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQuoteActionLogs } from '@/integrations/supabase/services/quotes';
import { useToast } from '@/hooks/use-toast';
import { useQuote } from '@/context/QuoteContext';
import { Button } from '@/components/ui/button';
import { Clock, FileTextIcon } from 'lucide-react';

const Quotes = () => {
  const { 
    allQuotes, 
    totalQuotes, 
    totalValue, 
    avgValue, 
    loading, 
    handleRefresh 
  } = useQuotes();

  const [activeTab, setActiveTab] = useState("orçamentos");
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { toast } = useToast();
  const quoteContext = useQuote();
  const currentUser = quoteContext?.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Garantir que allQuotes é sempre um array
  const safeQuotes = Array.isArray(allQuotes) ? allQuotes : [];

  const loadActionLogs = async () => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores e supervisores podem visualizar os logs de ações.",
        variant: "destructive"
      });
      return;
    }

    setLoadingLogs(true);
    try {
      const { success, logs, error } = await getQuoteActionLogs();
      if (success) {
        setActionLogs(logs);
      } else {
        console.error("Erro ao carregar logs:", error);
        toast({
          title: "Erro ao carregar logs",
          description: "Não foi possível carregar os registros de ações.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast({
        title: "Erro ao carregar logs",
        description: "Ocorreu um erro inesperado ao carregar os registros de ações.",
        variant: "destructive"
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "logs" && actionLogs.length === 0) {
      loadActionLogs();
    }
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <MainLayout>
      <div className="py-8">
        <QuotesHeader />
        
        <QuoteStats 
          totalQuotes={totalQuotes}
          totalValue={totalValue}
          avgValue={avgValue}
        />
        
        {isAdmin && (
          <Tabs defaultValue="orçamentos" className="mb-6" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="orçamentos" className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                <span>Orçamentos</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Logs de Ações</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="orçamentos">
              <div className="bg-white shadow rounded-md">
                <QuoteFilters 
                  loading={loading} 
                  onRefresh={handleRefresh} 
                />
                
                {safeQuotes.length === 0 ? (
                  <QuoteEmpty />
                ) : (
                  <QuoteTable 
                    quotes={safeQuotes} 
                    onRefresh={handleRefresh}
                  />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="logs">
              <div className="bg-white shadow rounded-md">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-medium">Logs de Ações em Orçamentos</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadActionLogs}
                    disabled={loadingLogs}
                  >
                    {loadingLogs ? 'Carregando...' : 'Atualizar Logs'}
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="py-3 px-4 text-left font-medium text-sm">Ação</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Orçamento</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Usuário</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLogs ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            Carregando logs de ações...
                          </td>
                        </tr>
                      ) : actionLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            Nenhum log de ação encontrado
                          </td>
                        </tr>
                      ) : (
                        actionLogs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-muted/20">
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                log.action_type === 'DELETE' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {log.action_type === 'DELETE' ? 'Exclusão' : 'Edição'}
                              </span>
                            </td>
                            <td className="py-3 px-4">{log.quote_title || `Orçamento: ${log.quote_id.substring(0, 8)}...`}</td>
                            <td className="py-3 px-4">{log.user_name || 'Usuário não identificado'}</td>
                            <td className="py-3 px-4">{formatDate(log.action_date)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {!isAdmin && (
          <div className="bg-white shadow rounded-md">
            <QuoteFilters 
              loading={loading} 
              onRefresh={handleRefresh} 
            />
            
            {safeQuotes.length === 0 ? (
              <QuoteEmpty />
            ) : (
              <QuoteTable 
                quotes={safeQuotes} 
                onRefresh={handleRefresh}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Quotes;
