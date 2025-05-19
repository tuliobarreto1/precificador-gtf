
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

interface ConnectionStatusAlertProps {
  status: 'online' | 'offline' | 'checking';
  offlineMode: boolean;
  testingConnection: boolean;
  error: string | null;
  detailedError: string | null;
  diagnosticInfo: any;
  onTestConnection: () => void;
}

const ConnectionStatusAlert: React.FC<ConnectionStatusAlertProps> = ({
  status,
  offlineMode,
  testingConnection,
  error,
  detailedError,
  diagnosticInfo,
  onTestConnection
}) => {
  if (offlineMode) {
    return (
      <Alert variant="default" className="mb-4 bg-amber-100 border-amber-500 text-amber-800">
        <Database className="h-4 w-4 text-amber-800" />
        <AlertTitle>Modo Offline Ativado</AlertTitle>
        <AlertDescription>
          <p>O sistema está operando com dados do cache local. Algumas funcionalidades podem estar limitadas.</p>
        </AlertDescription>
      </Alert>
    );
  }

  if (status !== 'offline') return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção: Problemas de conexão com o servidor</AlertTitle>
      <AlertDescription>
        <p>A conexão com o servidor de banco de dados pode estar indisponível. O sistema está usando dados em cache.</p>
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
            <AlertDialogContent className="max-w-xl max-h-[80vh] overflow-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Informações de Diagnóstico</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-2 space-y-2 text-left">
                    <p className="font-medium">Configurações de Servidor:</p>
                    <pre className="bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                      {`Servidor: ${process.env.DB_SERVER || 'Não definido'}
Porta: ${process.env.DB_PORT || '1433'}
Banco de dados: ${process.env.DB_DATABASE || 'Não definido'}
Timeout: 30000ms`}
                    </pre>
                    
                    <p className="font-medium mt-4">Possíveis Causas:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>O servidor SQL pode estar temporariamente indisponível</li>
                      <li>Problemas de rede ou conexão com a internet</li>
                      <li>Bloqueio por firewall ou VPN</li>
                      <li>O servidor pode estar configurado para limitar conexões</li>
                    </ul>
                    
                    <p className="font-medium mt-4">Recomendações:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verifique sua conexão com a internet</li>
                      <li>Tente novamente em alguns minutos</li>
                      <li>Aumente o timeout de conexão (atualmente 30 segundos)</li>
                      <li>Utilize o modo offline para continuar trabalhando</li>
                    </ul>
                    
                    {status && (
                      <div className="mt-4">
                        <p className="font-medium">Status da conexão:</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                          {JSON.stringify({ status }, null, 2)}
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

                    {detailedError && (
                      <div className="mt-4">
                        <p className="font-medium">Detalhes do erro:</p>
                        <pre className="bg-destructive/10 border border-destructive text-destructive p-2 rounded-md text-xs overflow-auto">
                          {detailedError}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
                <AlertDialogAction onClick={onTestConnection}>
                  {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
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
