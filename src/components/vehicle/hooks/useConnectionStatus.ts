
import { useState, useEffect } from 'react';
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
}

export const useConnectionStatus = ({ offlineMode, onError }: UseConnectionStatusProps) => {
  const [state, setState] = useState<ConnectionStatusState>({
    status: 'checking',
    testingConnection: false,
    detailedError: null,
    diagnosticInfo: null,
  });
  
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      setState(prev => ({ ...prev, testingConnection: true, status: 'checking' }));
      
      if (offlineMode) {
        setState(prev => ({ 
          ...prev, 
          status: 'offline', 
          testingConnection: false 
        }));
        return;
      }

      const status = await testApiConnection();
      console.log('Status da conexão:', status);
      
      setState(prev => ({ 
        ...prev, 
        status: status?.status as 'online' | 'offline',
        testingConnection: false,
        diagnosticInfo: status
      }));
      
      if (onError && status?.status !== 'online') {
        onError(`Problemas na conexão com o banco de dados: ${status?.error || 'offline'}`);
      } else if (onError) {
        onError(null);
      }
    } catch (error) {
      console.error('Falha ao verificar conexão:', error);
      
      setState(prev => ({ 
        ...prev, 
        status: 'offline', 
        testingConnection: false,
        detailedError: error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão' 
      }));
      
      if (onError) {
        onError('Falha ao verificar conexão com o banco de dados');
      }
    }
  };

  const testDatabaseConnection = async () => {
    try {
      setState(prev => ({ ...prev, testingConnection: true, detailedError: null }));
      if (onError) onError(null);
      
      const response = await fetch('/api/test-connection');
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
          diagnosticInfo: data.config || {}
        }));
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
          detailedError: JSON.stringify(data, null, 2),
          testingConnection: false
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
        detailedError: errorMsg,
        testingConnection: false
      }));
    }
  };

  useEffect(() => {
    checkConnection();
  }, [offlineMode]);

  return {
    ...state,
    checkConnection,
    testDatabaseConnection
  };
};
