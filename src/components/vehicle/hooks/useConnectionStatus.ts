
import { useState, useEffect, useCallback } from 'react';
import { testApiConnection } from '@/lib/sql-connection';

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
      console.log("Testando conexão com o banco de dados...");
      
      const connectionStatus = await testApiConnection();
      setLastCheckTime(new Date());
      setDiagnosticInfo(connectionStatus);
      
      if (connectionStatus && connectionStatus.status === 'online') {
        console.log("Conexão com o banco de dados: ONLINE");
        setStatus('online');
        setDetailedError(null);
        if (onError) onError(null);
        setFailureCount(0);
      } else {
        console.warn("Conexão com o banco de dados: OFFLINE", connectionStatus);
        setStatus('offline');
        
        const errorMsg = connectionStatus?.error || 'Não foi possível conectar ao banco de dados';
        setDetailedError(errorMsg);
        
        if (connectionStatus?.failCount) {
          setFailureCount(connectionStatus.failCount);
        }
        
        if (onError) onError(errorMsg);
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setStatus('offline');
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao conectar';
      setDetailedError(errorMsg);
      if (onError) onError(errorMsg);
      setFailureCount(prev => prev + 1);
    } finally {
      setTestingConnection(false);
    }
  }, [offlineMode, onError]);
  
  // Verificar a conexão quando o componente for montado
  useEffect(() => {
    // Se o modo offline estiver ativado, não verificamos a conexão
    if (offlineMode) {
      return;
    }
    
    console.log("Verificando status da conexão na montagem do componente...");
    testDatabaseConnection();
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
