
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { QuoteProvider } from '@/context/QuoteContext';
import QuoteForm from '@/components/quote/QuoteForm';
import { useTaxIndices } from '@/hooks/useTaxIndices';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testApiConnection } from '@/lib/sql-connection';
import { useToast } from '@/hooks/use-toast';

const NewQuote = () => {
  const { taxRates, ipvaRate, licensingFee } = useTaxIndices();
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isCheckingApi, setIsCheckingApi] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const { toast } = useToast();

  // Função para verificar o status da API
  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      setIsCheckingApi(true);
      
      console.log("Verificando status da API SQL Server...");
      const status = await testApiConnection();
      
      if (status && status.status === 'online') {
        console.log("API SQL Server online:", status);
        setApiStatus('online');
        setOfflineMode(false);
      } else {
        console.log("API SQL Server offline, ativando modo offline automaticamente:", status);
        setApiStatus('offline');
        setOfflineMode(true); // Ativar modo offline automaticamente
      }
    } catch (error) {
      console.log("Erro ao verificar status da API, ativando modo offline automaticamente:", error);
      setApiStatus('offline');
      setOfflineMode(true); // Ativar modo offline automaticamente
    } finally {
      setIsCheckingApi(false);
    }
  };
  
  const enableOfflineMode = () => {
    setOfflineMode(true);
    toast({
      title: "Modo offline ativado",
      description: "Usando dados do cache local. Algumas funcionalidades podem estar limitadas.",
    });
  };
  
  useEffect(() => {
    // Verificar status da API ao montar o componente
    checkApiStatus();
  }, []);
  
  return (
    <MainLayout>
      <QuoteProvider>
        <div className="mt-2">
          <PageTitle
            title="Criar orçamento"
            breadcrumbs={[
              { label: "Home", url: "/" },
              { label: "Orçamentos", url: "/orcamentos" },
              { label: "Novo Orçamento", url: "/orcamento/novo" }
            ]}
          />
        </div>
        
        {/* Remover completamente o alerta de erro quando offline */}
        {apiStatus === 'offline' && !offlineMode && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Modo Offline Ativado</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>O sistema está operando com dados do cache local. Todos os recursos básicos estão disponíveis.</p>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setOfflineMode(false);
                    checkApiStatus();
                  }}
                  className="flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <RefreshCw className="h-4 w-4" /> Tentar reconectar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <QuoteForm />
      </QuoteProvider>
    </MainLayout>
  );
};

export default NewQuote;
