
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database, PieChart, Server, Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
  // Função para obter timestamp do cache mais recente
  const getCacheTimestamp = () => {
    if (!diagnosticInfo?.cache) return null;
    
    // Aqui podemos implementar uma lógica para pegar o timestamp mais recente do cache
    // Por enquanto, vamos usar uma data simulada ou lastCheckTime
    return lastCheckTime;
  };

  // Função para renderizar informações do cache com timestamp
  const renderCacheInfo = () => {
    if (!diagnosticInfo?.cache) return null;
    
    const { cache } = diagnosticInfo;
    const cacheAvailable = cache.available;
    const cacheRecent = cache.groupsRecent && cache.modelsRecent;
    const cacheTimestamp = getCacheTimestamp();
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex items-center gap-2 text-sm mb-2">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">Status do Cache Local:</span>
        </div>
        
        <div className="text-xs text-blue-700 space-y-1">
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
          
          {cacheTimestamp && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="flex items-center gap-1 text-blue-600">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  Última atualização: {cacheTimestamp.toLocaleDateString('pt-BR')} às {cacheTimestamp.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          )}
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
            Usando dados do cache local. Todos os recursos básicos estão disponíveis.
            {diagnosticInfo?.cache?.available && (
              <span className="block mt-1 text-green-700 font-medium">
                ✓ Dados salvos disponíveis para uso
              </span>
            )}
          </AlertDescription>
          {renderCacheInfo()}
        </Alert>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-2">Atualizar Cache Local</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Busque os dados mais recentes da Locavia e salve no cache local.
          </p>
          <CacheUpdateButton onUpdateComplete={onTestConnection} />
        </div>
      </div>
    );
  }

  if (status === 'checking' || testingConnection) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <AlertTitle className="text-blue-800">Verificando Conexão</AlertTitle>
        <AlertDescription className="text-blue-700">
          Testando conexão com a Locavia...
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
                Verificado em: {lastCheckTime.toLocaleString('pt-BR')}
              </span>
            )}
          </AlertDescription>
          {renderCacheInfo()}
        </Alert>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-2">Atualizar Cache Local</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Mantenha o cache atualizado com os dados mais recentes da Locavia.
          </p>
          <CacheUpdateButton onUpdateComplete={onTestConnection} />
        </div>
      </div>
    );
  }

  // Status offline - mostrar de forma mais suave
  const hasCache = diagnosticInfo?.cache?.available;

  if (hasCache) {
    // Se há cache, mostrar como funcionamento normal em modo offline
    return (
      <div className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Modo Offline</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="space-y-2">
              <p>
                Usando dados do cache local. A maioria dos recursos estão disponíveis.
              </p>
              
              <div className="text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                <p className="font-medium">💾 Cache Disponível</p>
                <p className="text-xs mt-1">
                  Dados salvos estão sendo utilizados normalmente.
                </p>
              </div>
            </div>
          </AlertDescription>
          {renderCacheInfo()}
        </Alert>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-2">Tentar Conexão com Locavia</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Tente reconectar para buscar dados mais recentes.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTestConnection}
              disabled={testingConnection}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              {testingConnection ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Tentar Conectar
            </Button>
            <CacheUpdateButton onUpdateComplete={onTestConnection} />
          </div>
        </div>
      </div>
    );
  }

  // Se não há cache, mostrar aviso mais sério
  return (
    <div className="space-y-4">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Modo Offline - Cache Indisponível</AlertTitle>
        <AlertDescription className="text-yellow-700">
          <div className="space-y-2">
            <p>
              Não foi possível conectar à Locavia e não há dados no cache.
            </p>
            
            <div className="text-yellow-700 bg-yellow-100 p-2 rounded border border-yellow-200">
              <p className="font-medium">⚠ Funcionalidade Limitada</p>
              <p className="text-xs mt-1">
                Apenas dados padrão estarão disponíveis até restabelecer a conexão ou atualizar o cache.
              </p>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onTestConnection}
                disabled={testingConnection}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                {testingConnection ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Tentar Conectar
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-medium mb-2">Tentar Buscar Dados</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Tente buscar dados da Locavia para popular o cache local.
        </p>
        <CacheUpdateButton onUpdateComplete={onTestConnection} />
      </div>
    </div>
  );
};

export default ConnectionStatusAlert;
