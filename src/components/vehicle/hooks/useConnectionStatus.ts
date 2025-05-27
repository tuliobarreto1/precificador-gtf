
import { useState, useEffect, useCallback } from 'react';
import { testApiConnection } from '@/lib/sql-connection';
import { getLastSyncStatus } from '@/lib/vehicle-sync';

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
        console.log("Conexão com o banco de dados: OFFLINE - Verificando cache...");
        setStatus('offline');
        
        // Verificar se há cache disponível antes de mostrar erro
        try {
          const cacheStatus = await getLastSyncStatus();
          const hasCacheAvailable = cacheStatus.vehicleCount > 0;
          
          if (hasCacheAvailable) {
            console.log("Cache disponível - funcionamento normal offline");
            setDetailedError(null);
            if (onError) onError(null);
          } else {
            console.log("Cache indisponível - funcionalidade limitada");
            const errorMsg = 'Cache indisponível - funcionalidade limitada';
            setDetailedError(errorMsg);
            if (onError) onError(errorMsg);
          }
        } catch (cacheError) {
          console.error("Erro ao verificar cache:", cacheError);
          const errorMsg = 'Erro ao verificar cache local';
          setDetailedError(errorMsg);
          if (onError) onError(errorMsg);
        }
        
        if (connectionStatus?.failCount) {
          setFailureCount(connectionStatus.failCount);
        }
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setStatus('offline');
      
      // Verificar cache mesmo em caso de erro na conexão
      try {
        const cacheStatus = await getLastSyncStatus();
        const hasCacheAvailable = cacheStatus.vehicleCount > 0;
        
        if (hasCacheAvailable) {
          console.log("Erro na conexão, mas cache disponível - funcionamento offline");
          setDetailedError(null);
          if (onError) onError(null);
        } else {
          const errorMsg = 'Modo offline ativo - cache indisponível';
          setDetailedError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } catch (cacheError) {
        const errorMsg = 'Erro ao verificar cache local';
        setDetailedError(errorMsg);
        if (onError) onError(errorMsg);
      }
      
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
