
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database, PieChart, Server, Wifi, WifiOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  const isOnline = () => status === 'online';
  
  const copyDiagnosticInfo = () => {
    const info = JSON.stringify(diagnosticInfo, null, 2);
    navigator.clipboard.writeText(info).then(() => {
      toast({
        title: "Copiado!",
        description: "Informações de diagnóstico copiadas para a área de transferência.",
      });
    });
  };
  
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
            {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Testar Conexão
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PieChart className="mr-2 h-4 w-4" />
                Informações de Diagnóstico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Informações de Diagnóstico</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-2 space-y-4 text-left">
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
                    
                    <div>
                      <p className="font-medium">Configurações do Ambiente:</p>
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                        {`Ambiente: ${import.meta.env.MODE}
URL da API: ${import.meta.env.PROD ? 'https://precificador-gtf.vercel.app/api' : 'http://localhost:3005/api'}
Servidor: asalocadora-prd-nlb-rds-4f4ca747cca4f9bf.elb.us-east-1.amazonaws.com
Porta: 1433
Banco de dados: Locavia
Usuário: tulio.barreto`}
                      </pre>
                    </div>
                    
                    {detailedError && (
                      <div>
                        <p className="font-medium">Erro Detalhado:</p>
                        <pre className="bg-destructive/10 border border-destructive text-destructive p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                          {detailedError}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium">Possíveis Soluções:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Verifique se o servidor SQL Server está rodando e acessível</li>
                        <li>Confirme se as credenciais do banco de dados estão corretas</li>
                        <li>Teste a conectividade de rede com o servidor</li>
                        <li>Verifique se não há firewall bloqueando a porta 1433</li>
                        <li>Confirme se o serviço de API proxy está rodando na porta 3005</li>
                        <li>Tente reiniciar o servidor de API local</li>
                      </ul>
                    </div>
                    
                    {diagnosticInfo && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">Informações Técnicas de Diagnóstico:</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyDiagnosticInfo}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-60">
                          {JSON.stringify(diagnosticInfo, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium">Comandos para Diagnóstico:</p>
                      <div className="bg-muted p-2 rounded-md text-xs">
                        <p>Para testar a conexão manualmente:</p>
                        <code>curl -X GET http://localhost:3005/api/status</code>
                        <br />
                        <code>curl -X GET http://localhost:3005/api/test-connection</code>
                      </div>
                    </div>
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
