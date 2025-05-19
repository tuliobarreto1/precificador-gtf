
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
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
        <p>A conexão com o servidor de banco de dados pode estar indisponível.</p>
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
                <RefreshCw className="mr-2 h-4 w-4" />
                Informações de Diagnóstico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-xl max-h-[80vh] overflow-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Informações de Diagnóstico</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-2 space-y-2 text-left">
                    <p className="font-medium">Arquivo .env:</p>
                    <p>O arquivo está localizado na raiz do projeto e pode ser configurado com as seguintes variáveis:</p>
                    <pre className="bg-muted p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap">
                      {`PORT=3005
NODE_ENV=development
DB_SERVER=seu-servidor
DB_PORT=1433
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_DATABASE=seu-banco-de-dados`}
                    </pre>
                    
                    <p className="font-medium mt-4">Para iniciar o projeto:</p>
                    <p>Use o comando <code className="bg-muted p-1 rounded">node start-dev.js</code> na raiz do projeto.</p>
                    
                    <p className="font-medium mt-4">Conexão com o Banco de Dados:</p>
                    {status && (
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                        {JSON.stringify({ status }, null, 2)}
                      </pre>
                    )}
                    
                    {diagnosticInfo && (
                      <>
                        <p className="font-medium mt-4">Últimas informações de diagnóstico:</p>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                          {JSON.stringify(diagnosticInfo, null, 2)}
                        </pre>
                      </>
                    )}

                    {detailedError && (
                      <>
                        <p className="font-medium mt-4">Detalhes do erro:</p>
                        <pre className="bg-destructive/10 border border-destructive text-destructive p-2 rounded-md text-xs overflow-auto">
                          {detailedError}
                        </pre>
                      </>
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
