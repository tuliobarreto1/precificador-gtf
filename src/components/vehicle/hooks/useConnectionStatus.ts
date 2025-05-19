
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { testApiConnection } from '@/lib/sql-connection';

interface UseConnectionStatusProps {
  offlineMode: boolean;
  onError?: (errorMessage: string | null) => void;
}

interface ConnectionStatusState {
  status: 'online' | 'offline' | 'checking';
  testingConnection: boolean;
  detailedError: string | null;
  diagnosticInfo: any;
  lastCheckTime: Date | null;
  failureCount: number;
}

export const useConnectionStatus = ({ offlineMode, onError }: UseConnectionStatusProps) => {
  const [state, setState] = useState<ConnectionStatusState>({
    status: 'checking',
    testingConnection: false,
    detailedError: null,
    diagnosticInfo: null,
    lastCheckTime: null,
    failureCount: 0
  });
  
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, testingConnection: true, status: 'checking' }));
      
      if (offlineMode) {
        setState(prev => ({ 
          ...prev, 
          status: 'offline', 
          testingConnection: false,
          lastCheckTime: new Date()
        }));
        return;
      }

      const status = await testApiConnection();
      console.log('Status da conexão:', status);
      
      setState(prev => ({ 
        ...prev, 
        status: status?.status as 'online' | 'offline',
        testingConnection: false,
        diagnosticInfo: status,
        lastCheckTime: new Date(),
        // Resetar o contador de falhas se a conexão for bem-sucedida
        failureCount: status?.status === 'online' ? 0 : prev.failureCount + 1
      }));
      
      if (onError && status?.status !== 'online') {
        const errorMessage = status?.error ? 
          `Problemas na conexão com o banco de dados: ${status.error}` : 
          'Servidor de banco de dados offline';
        onError(errorMessage);
      } else if (onError) {
        onError(null);
      }
    } catch (error) {
      console.error('Falha ao verificar conexão:', error);
      
      setState(prev => ({ 
        ...prev, 
        status: 'offline', 
        testingConnection: false,
        detailedError: error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão',
        lastCheckTime: new Date(),
        failureCount: prev.failureCount + 1
      }));
      
      if (onError) {
        onError('Falha ao verificar conexão com o banco de dados');
      }
    }
  }, [offlineMode, onError]);

  const testDatabaseConnection = async () => {
    try {
      setState(prev => ({ ...prev, testingConnection: true, detailedError: null }));
      if (onError) onError(null);
      
      toast({
        title: "Verificando conexão",
        description: "Testando a conexão com o banco de dados. Isto pode levar alguns segundos.",
      });
      
      const response = await fetch('http://localhost:3005/api/test-connection');
      let data;
      
      try {
        data = await response.json();
        setState(prev => ({ ...prev, diagnosticInfo: data }));
      } catch (jsonError) {
        const textResponse = await response.text();
        setState(prev => ({
          ...prev,
          detailedError: `Erro ao analisar resposta JSON: ${textResponse}`,
          diagnosticInfo: { error: "Falha ao analisar resposta", textResponse },
          testingConnection: false
        }));
        
        if (onError) onError("Falha ao analisar resposta do servidor");
        
        toast({
          title: "Erro na resposta",
          description: "A resposta do servidor não está no formato esperado.",
          variant: "destructive",
        });
        return;
      }
      
      if (response.ok) {
        if (onError) onError(null);
        toast({
          title: "Conexão bem-sucedida",
          description: "A conexão com o banco de dados foi estabelecida com sucesso.",
        });
        console.log('Teste de conexão bem-sucedido:', data);
        
        setState(prev => ({
          ...prev,
          status: 'online',
          testingConnection: false,
          diagnosticInfo: data.config || {},
          detailedError: null,
          failureCount: 0
        }));
        
        // Aguardar um pequeno delay e depois atualizar o status novamente
        setTimeout(() => {
          checkConnection();
        }, 2000);
      } else {
        const errorMsg = data.message || "Não foi possível conectar ao banco de dados.";
        if (onError) onError(errorMsg);
        
        toast({
          title: "Falha na conexão",
          description: errorMsg,
          variant: "destructive",
        });
        
        console.error('Teste de conexão falhou:', data);
        
        setState(prev => ({
          ...prev,
          status: 'offline',
          detailedError: JSON.stringify(data, null, 2),
          testingConnection: false,
          failureCount: prev.failureCount + 1
        }));
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao testar conexão';
      
      if (onError) onError(errorMsg);
      
      toast({
        title: "Erro",
        description: "Erro ao tentar testar a conexão com o banco de dados.",
        variant: "destructive",
      });
      
      setState(prev => ({
        ...prev,
        status: 'offline',
        detailedError: errorMsg,
        testingConnection: false,
        failureCount: prev.failureCount + 1
      }));
    }
  };

  // Verificar status inicial da conexão
  useEffect(() => {
    checkConnection();
    
    // Verificar conexão periodicamente a cada 5 minutos
    const intervalId = setInterval(() => {
      if (!offlineMode) {
        checkConnection();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [offlineMode, checkConnection]);

  return {
    ...state,
    checkConnection,
    testDatabaseConnection
  };
};
