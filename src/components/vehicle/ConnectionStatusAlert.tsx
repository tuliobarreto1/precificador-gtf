
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database, PieChart, Server, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusAlertProps {
  status: 'online' | 'offline' | 'checking';
  offlineMode: boolean;
  testingConnection: boolean;
  error: string | null;
  detailedError: string | null;
  diagnosticInfo: any;
  lastCheckTime?: Date | null;
  failureCount?: number;
  onTestConnection: () => void;
  onEnableOfflineMode?: () => void;
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
  onTestConnection,
  onEnableOfflineMode
}) => {
  // Criando uma função auxiliar para verificar o status
  const isOnline = () => status === 'online';
  
  if (offlineMode) {
    return (
      <Alert variant="default" className="mb-4 bg-amber-100 border-amber-500 text-amber-800">
        <Database className="h-4 w-4 text-amber-800" />
        <AlertTitle className="flex items-center gap-2">
          Modo Offline Ativado
          <Badge variant="outline" className="ml-2 px-1 py-0 h-5 bg-amber-200">Manual</Badge>
        </AlertTitle>
        <AlertDescription>
          <p>O sistema está operando com dados do cache local. Algumas funcionalidades podem estar limitadas.</p>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'checking') {
    return (
      <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 text-blue-800">
        <Loader2 className="h-4 w-4 animate-spin text-blue-800" />
        <AlertTitle>Verificando conexão...</AlertTitle>
        <AlertDescription>
          <p>Aguarde enquanto verificamos a conexão com o servidor de banco de dados.</p>
        </AlertDescription>
      </Alert>
    );
  }

  if (isOnline()) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center">
        Atenção: Problemas de conexão com o servidor
        <Badge 
          variant="outline" 
          className={`ml-2 px-1 py-0 h-5 ${failureCount > 3 ? 'bg-red-200' : 'bg-amber-200'}`}
        >
          {failureCount > 0 && `${failureCount} falha${failureCount > 1 ? 's' : ''}`}
          {!failureCount && 'Offline'}
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <p>A conexão com o servidor de banco de dados pode estar indisponível. O sistema está usando dados em cache.</p>
        {lastCheckTime && (
          <p className="text-xs mt-1">
            Última verificação: {lastCheckTime.toLocaleTimeString()}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button 
            onClick={onTestConnection} 
            variant="outline" 
            size="sm"
            disabled={testingConnection}
          >
            {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Verificar novamente
          </Button>
          
          {onEnableOfflineMode && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEnableOfflineMode}
              className="flex items-center gap-1"
            >
              <Database className="mr-2 h-4 w-4" /> 
              Usar modo offline
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PieChart className="mr-2 h-4 w-4" />
                Informações de Diagnóstico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-xl max-h-[80vh] overflow-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Informações de Diagnóstico</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-2 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isOnline() ? 'outline' : 'destructive'} 
                        className={isOnline() ? 'bg-green-100 text-green-800 px-2 py-1' : 'px-2 py-1'}
                      >
                        {isOnline() ? (
                          <><Wifi className="h-3 w-3 mr-1" /> Online</>
                        ) : (
                          <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                        )}
                      </Badge>
                      {lastCheckTime && (
                        <span className="text-xs text-muted-foreground">
                          Verificado às {lastCheckTime.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    
                    <p className="font-medium">Ambiente:</p>
                    <pre className="bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                      {`Ambiente: ${window.location.hostname.includes('lovableproject.com') ? 'Produção (Lovable)' : 'Desenvolvimento (Local)'}
URL Base API: ${window.location.hostname.includes('lovableproject.com') ? 'https://precificador-api.vercel.app/api' : 'http://localhost:3005/api'}
`}
                    </pre>
                    
                    <p className="font-medium">Possíveis Causas:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Em produção: a API externa não está acessível</li>
                      <li>Problemas de CORS (Cross-Origin Resource Sharing)</li>
                      <li>Firewall bloqueando conexões</li>
                      <li>API indisponível ou fora do ar</li>
                    </ul>
                    
                    <p className="font-medium mt-4">Recomendações:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verifique se o serviço da API está rodando</li>
                      <li>Confirme que a URL da API está correta</li>
                      <li>Verifique se o servidor permite requisições CORS</li>
                      <li>Utilize o modo offline para continuar trabalhando</li>
                    </ul>
                    
                    {detailedError && (
                      <div className="mt-4">
                        <p className="font-medium">Detalhes do erro:</p>
                        <pre className="bg-destructive/10 border border-destructive text-destructive p-2 rounded-md text-xs overflow-auto">
                          {detailedError}
                        </pre>
                      </div>
                    )}

                    {diagnosticInfo && (
                      <div className="mt-4">
                        <p className="font-medium">Últimas informações de diagnóstico:</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                          {JSON.stringify(diagnosticInfo, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
                <AlertDialogAction onClick={onTestConnection}>
                  {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
                  Testar Conexão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionStatusAlert;
