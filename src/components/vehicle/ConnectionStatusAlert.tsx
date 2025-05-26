
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database, PieChart, Server, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CacheUpdateButton from './CacheUpdateButton';

interface ConnectionStatusAlertProps {
  status: 'online' | 'offline' | 'checking';
  offlineMode: boolean;
  testingConnection: boolean;
  error: string | null;
  detailedError?: string | null;
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
  failureCount = 0,
  onTestConnection
}) => {
  // Função para renderizar informações do cache
  const renderCacheInfo = () => {
    if (!diagnosticInfo?.cache) return null;
    
    const { cache } = diagnosticInfo;
    const cacheAvailable = cache.available;
    const cacheRecent = cache.groupsRecent && cache.modelsRecent;
    
    return (
      <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">Status do Cache:</span>
        </div>
        <div className="mt-1 text-xs text-blue-700 space-y-1">
          <div className="flex justify-between">
            <span>Cache disponível:</span>
            <span className={cacheAvailable ? 'text-green-600 font-medium' : 'text-red-600'}>
              {cacheAvailable ? '✓ Sim' : '✗ Não'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Dados recentes:</span>
            <span className={cacheRecent ? 'text-green-600 font-medium' : 'text-yellow-600'}>
              {cacheRecent ? '✓ Atualizados' : '⚠ Desatualizados'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Grupos em cache:</span>
            <span className={cache.groupsRecent ? 'text-green-600' : 'text-gray-500'}>
              {cache.groupsRecent ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Modelos em cache:</span>
            <span className={cache.modelsRecent ? 'text-green-600' : 'text-gray-500'}>
              {cache.modelsRecent ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Renderização do alerta baseado no status
  if (offlineMode) {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Modo Cache Ativado</AlertTitle>
          <AlertDescription className="text-blue-700">
            Usando dados do cache local. Funcionalidades limitadas, mas os dados básicos estão disponíveis.
            {diagnosticInfo?.cache?.available && (
              <span className="block mt-1 text-green-700 font-medium">
                ✓ Cache disponível com dados salvos
              </span>
            )}
          </AlertDescription>
          {renderCacheInfo()}
        </Alert>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-2">Atualizar Cache Local</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Busque os dados mais recentes da Locavia e salve no cache local para uso offline.
          </p>
          <CacheUpdateButton onUpdateComplete={onTestConnection} />
        </div>
      </div>
    );
  }

  if (status === 'checking' || testingConnection) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
        <AlertTitle className="text-yellow-800">Verificando Conexão</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Testando conexão com o banco de dados e verificando cache...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'online') {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Conexão Online</AlertTitle>
          <AlertDescription className="text-green-700">
            Conectado ao SQL Server da Locavia. Todos os recursos estão disponíveis.
            {lastCheckTime && (
              <span className="block mt-1 text-xs text-green-600">
                Última verificação: {lastCheckTime.toLocaleString()}
              </span>
            )}
          </AlertDescription>
          {renderCacheInfo()}
        </Alert>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-2">Atualizar Cache Local</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Atualize o cache local com os dados mais recentes da Locavia.
          </p>
          <CacheUpdateButton onUpdateComplete={onTestConnection} />
        </div>
      </div>
    );
  }

  // Status offline
  const hasCache = diagnosticInfo?.cache?.available;
  const recommendedMode = diagnosticInfo?.recommendedMode;

  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Conexão Offline</AlertTitle>
        <AlertDescription className="text-red-700">
          <div className="space-y-2">
            <p>
              Não foi possível conectar ao SQL Server da Locavia.
              {failureCount && failureCount > 1 && (
                <span className="block text-xs">
                  Tentativas falharam: {failureCount}
                </span>
              )}
            </p>
            
            {hasCache ? (
              <div className="text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                <p className="font-medium">💾 Cache Disponível</p>
                <p className="text-xs mt-1">
                  Dados salvos anteriormente estão disponíveis. 
                  {recommendedMode === 'cache' && ' Recomendamos usar o modo cache.'}
                </p>
              </div>
            ) : (
              <div className="text-yellow-700 bg-yellow-100 p-2 rounded border border-yellow-200">
                <p className="font-medium">⚠ Cache Indisponível</p>
                <p className="text-xs mt-1">
                  Nenhum dado foi encontrado no cache. Apenas dados padrão estarão disponíveis.
                </p>
              </div>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onTestConnection}
                disabled={testingConnection}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                {testingConnection ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Tentar Novamente
              </Button>
            </div>
          </div>
        </AlertDescription>
        {renderCacheInfo()}
      </Alert>
      
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-medium mb-2">Tentar Atualizar Cache</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Mesmo offline, você pode tentar buscar dados recentes se a conexão se restabelecer temporariamente.
        </p>
        <CacheUpdateButton onUpdateComplete={onTestConnection} />
      </div>
    </div>
  );
};

export default ConnectionStatusAlert;
