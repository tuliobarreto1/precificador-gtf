
import { useState, useEffect, useCallback } from 'react';
import { testApiConnection, pingApi, getSystemInfo } from '@/lib/sql-connection';

interface UseConnectionStatusProps {
  offlineMode: boolean;
  onError?: (errorMessage: string | null) => void;
}

export const useConnectionStatus = ({ offlineMode, onError }: UseConnectionStatusProps) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState<number>(0);
  
  const testDatabaseConnection = useCallback(async () => {
    if (offlineMode) {
      return;
    }
    
    try {
      setTestingConnection(true);
      setDetailedError(null);
      console.log("Testando conexão com o banco de dados...");
      
      // Primeiro, obter informações detalhadas do sistema
      const systemInfo = await getSystemInfo();
      setDiagnosticInfo(systemInfo);
      
      // Depois, testar a conexão principal
      const connectionStatus = await testApiConnection();
      setLastCheckTime(new Date());
      
      if (connectionStatus && connectionStatus.status === 'online') {
        console.log("Conexão com o banco de dados: ONLINE");
        setStatus('online');
        setDetailedError(null);
        if (onError) onError(null);
        setFailureCount(0);
      } else {
        console.warn("Conexão com o banco de dados: OFFLINE", connectionStatus);
        setStatus('offline');
        
        // Criar uma mensagem de erro mais detalhada
        let errorMsg = 'Não foi possível conectar ao banco de dados';
        
        if (connectionStatus?.error) {
          errorMsg = connectionStatus.error;
        }
        
        // Adicionar informações de diagnóstico se disponíveis
        if (connectionStatus?.details) {
          const details = JSON.stringify(connectionStatus.details, null, 2);
          errorMsg += `\n\nDetalhes técnicos:\n${details}`;
        }
        
        setDetailedError(errorMsg);
        setFailureCount(prev => prev + 1);
        
        if (onError) onError(errorMsg);
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setStatus('offline');
      
      let errorMsg = 'Erro desconhecido ao conectar';
      
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Adicionar sugestões baseadas no tipo de erro
        if (error.message.includes('fetch')) {
          errorMsg += '\n\nSugestões:\n- Verifique sua conexão com a internet\n- O servidor pode estar indisponível\n- Tente novamente em alguns minutos';
        } else if (error.message.includes('timeout')) {
          errorMsg += '\n\nSugestões:\n- O servidor está demorando muito para responder\n- Tente usar modo offline temporariamente\n- Verifique se há problemas de rede';
        } else if (error.message.includes('JSON')) {
          errorMsg += '\n\nSugestões:\n- O servidor pode estar retornando uma página de erro\n- Verifique se a URL da API está correta\n- O servidor pode estar em manutenção';
        }
      }
      
      setDetailedError(errorMsg);
      setFailureCount(prev => prev + 1);
      
      if (onError) onError(errorMsg);
    } finally {
      setTestingConnection(false);
    }
  }, [offlineMode, onError]);
  
  // Verificar a conexão quando o componente for montado
  useEffect(() => {
    if (offlineMode) {
      setStatus('offline');
      return;
    }
    
    console.log("Verificando status da conexão na montagem do componente...");
    testDatabaseConnection();
  }, [offlineMode, testDatabaseConnection]);
  
  // Verificação periódica da conexão (a cada 5 minutos)
  useEffect(() => {
    if (offlineMode) return;
    
    const interval = setInterval(() => {
      console.log("Verificação periódica da conexão...");
      testDatabaseConnection();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [offlineMode, testDatabaseConnection]);
  
  return {
    status,
    testingConnection,
    detailedError,
    diagnosticInfo,
    lastCheckTime,
    failureCount,
    testDatabaseConnection
  };
};
