
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const { toast } = useToast();

  // Adicionando console.log para verificar renderização da página
  console.log("Renderizando página NewQuote");
  
  // Função para verificar o status da API
  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      setApiError(null);
      setIsCheckingApi(true);
      
      console.log("Verificando status da API SQL Server...");
      const status = await testApiConnection();
      
      if (status && status.status === 'online') {
        console.log("API SQL Server online:", status);
        setApiStatus('online');
        setOfflineMode(false);
      } else {
        console.warn("API SQL Server offline ou com problemas:", status);
        setApiStatus('offline');
        setApiError(`API indisponível: ${status?.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao verificar status da API:", error);
      setApiStatus('offline');
      setApiError(error instanceof Error ? error.message : 'Erro ao conectar com a API');
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
    
    // Log adicional ao montar o componente para depuração
    console.log("NewQuote montado - verificando configurações de impostos");
    
    // Verificar configurações globais de impostos para depuração
    console.log("Configurações de impostos carregadas:", {
      taxRates,
      ipvaRate,
      licensingFee
    });
    
    // Configurar verificação periódica do status da API (a cada 60 segundos)
    const interval = setInterval(() => {
      // Só verificar novamente se não estamos em modo offline
      if (!offlineMode) {
        console.log("Verificação periódica do status da API...");
        checkApiStatus();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [taxRates, ipvaRate, licensingFee, offlineMode]);
  
  return (
    <MainLayout>
      <QuoteProvider>
        <PageTitle
          title="Criar orçamento"
          breadcrumbs={[
            { label: "Home", url: "/" },
            { label: "Orçamentos", url: "/orcamentos" },
            { label: "Novo Orçamento", url: "/orcamento/novo" }
          ]}
        />
        
        {apiStatus === 'offline' && !offlineMode && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problema de conexão com o banco de dados</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>O servidor de banco de dados não está respondendo. Você pode continuar em modo offline ou tentar reconectar.</p>
              {apiError && <p className="text-sm bg-destructive/10 p-2 rounded-sm font-mono">{apiError}</p>}
              <div className="flex justify-end mt-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkApiStatus}
                  disabled={isCheckingApi}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isCheckingApi ? 'animate-spin' : ''}`} /> 
                  {isCheckingApi ? 'Verificando...' : 'Verificar novamente'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={enableOfflineMode}
                  className="flex items-center gap-1"
                >
                  <Database className="h-4 w-4" /> 
                  Usar modo offline
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {offlineMode && (
          <Alert className="mb-4 bg-amber-100 border-amber-500 text-amber-800">
            <Database className="h-4 w-4 text-amber-800" />
            <AlertTitle>Modo Offline Ativado</AlertTitle>
            <AlertDescription>
              <p>O sistema está operando com dados do cache local. Algumas funcionalidades podem estar limitadas.</p>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setOfflineMode(false);
                    checkApiStatus();
                  }}
                  className="flex items-center gap-1 border-amber-500 text-amber-800 hover:bg-amber-200"
                >
                  <RefreshCw className="h-4 w-4" /> Tentar reconectar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <QuoteForm offlineMode={offlineMode} />
      </QuoteProvider>
    </MainLayout>
  );
};

export default NewQuote;
