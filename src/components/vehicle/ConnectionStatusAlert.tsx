
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Database, Download } from 'lucide-react';
import CacheUpdateButton from './CacheUpdateButton';
import VehicleSyncButton from './VehicleSyncButton';
import { getLastSyncStatus } from '@/lib/vehicle-sync';

interface ConnectionStatusAlertProps {
  status: 'online' | 'offline' | 'checking';
  offlineMode: boolean;
  testingConnection: boolean;
  error: string | null;
  detailedError: string | null;
  diagnosticInfo?: any;
  lastCheckTime?: Date | null;
  failureCount?: number;
  onTestConnection: () => void;
}

const ConnectionStatusAlert: React.FC<ConnectionStatusAlertProps> = ({
  status,
  offlineMode,
  testingConnection,
  error,
  detailedError,
  diagnosticInfo,
  lastCheckTime,
  failureCount,
  onTestConnection
}) => {
  const [cacheInfo, setCacheInfo] = useState<{
    lastSync: Date | null;
    vehicleCount: number;
  }>({ lastSync: null, vehicleCount: 0 });

  // Carregar informações do cache
  useEffect(() => {
    const loadCacheInfo = async () => {
      try {
        const syncStatus = await getLastSyncStatus();
        setCacheInfo(syncStatus);
      } catch (error) {
        console.error('Erro ao carregar informações do cache:', error);
      }
    };

    loadCacheInfo();
  }, [status, offlineMode]);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Se estiver online, mostrar opções de sincronização
  if (status === 'online' && !offlineMode) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Sistema Online</AlertTitle>
        <AlertDescription className="text-green-700">
          <p className="mb-3">Conectado à base de dados da Locavia. Você pode sincronizar todos os veículos para ter acesso completo offline.</p>
          
          {/* Informações do cache mesmo quando online */}
          {cacheInfo.vehicleCount > 0 && (
            <div className="flex justify-between items-center text-sm text-green-600 mb-3 bg-green-100 p-2 rounded">
              <span>Última sincronização: {formatLastSync(cacheInfo.lastSync)}</span>
              <span>{cacheInfo.vehicleCount.toLocaleString('pt-BR')} veículos no cache</span>
            </div>
          )}
          
          <VehicleSyncButton />
        </AlertDescription>
      </Alert>
    );
  }

  // Se estiver offline, mostrar informações do cache (sem erro se houver cache)
  if (status === 'offline' || offlineMode) {
    const hasCacheAvailable = cacheInfo.vehicleCount > 0;
    
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Modo Offline</AlertTitle>
        <AlertDescription className="text-blue-700">
          {hasCacheAvailable ? (
            <>
              <p className="mb-3">
                Sistema funcionando com dados do cache local. Todos os recursos estão disponíveis.
              </p>
              
              {/* Informações detalhadas do cache */}
              <div className="bg-blue-100 p-3 rounded mb-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Última sincronização:</span>
                  <span>{formatLastSync(cacheInfo.lastSync)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Veículos disponíveis:</span>
                  <span className="font-semibold">{cacheInfo.vehicleCount.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="mb-3">
              Cache indisponível - funcionalidade limitada. Para atualizar os dados, conecte-se à rede e execute uma sincronização.
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <CacheUpdateButton />
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTestConnection}
              disabled={testingConnection}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <RefreshCw className={`h-4 w-4 ${testingConnection ? 'animate-spin' : ''}`} />
              Tentar Reconectar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Estado de verificação
  if (status === 'checking') {
    return (
      <Alert className="bg-gray-50 border-gray-200">
        <RefreshCw className="h-4 w-4 animate-spin text-gray-600" />
        <AlertTitle className="text-gray-800">Verificando Conexão</AlertTitle>
        <AlertDescription className="text-gray-700">
          Verificando status da conexão com a base de dados...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ConnectionStatusAlert;
