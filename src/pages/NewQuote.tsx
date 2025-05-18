
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { QuoteProvider } from '@/context/QuoteContext';
import QuoteForm from '@/components/quote/QuoteForm';
import { useTaxIndices } from '@/hooks/useTaxIndices';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testApiConnection } from '@/lib/sql-connection';

const NewQuote = () => {
  const { taxRates, ipvaRate, licensingFee } = useTaxIndices();
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [apiError, setApiError] = useState<string | null>(null);

  // Adicionando console.log para verificar renderização da página
  console.log("Renderizando página NewQuote");
  
  // Função para verificar o status da API
  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      setApiError(null);
      
      console.log("Verificando status da API SQL Server...");
      const status = await testApiConnection();
      
      if (status && status.status === 'online') {
        console.log("API SQL Server online:", status);
        setApiStatus('online');
      } else {
        console.warn("API SQL Server offline ou com problemas:", status);
        setApiStatus('offline');
        setApiError(`API indisponível: ${status?.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao verificar status da API:", error);
      setApiStatus('offline');
      setApiError(error instanceof Error ? error.message : 'Erro ao conectar com a API');
    }
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
  }, [taxRates, ipvaRate, licensingFee]);
  
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
        
        {apiStatus === 'offline' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problema de conexão com o banco de dados</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>O servidor de banco de dados não está respondendo.</p>
              {apiError && <p className="text-sm">{apiError}</p>}
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkApiStatus}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" /> Verificar novamente
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
