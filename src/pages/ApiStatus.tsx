
import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, Database, Car, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { testApiConnection, getVehicleByPlate } from '@/lib/sql-connection';
import { Card } from '@/components/ui/card';
import PageTitle from '@/components/ui-custom/PageTitle';

const ApiStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; environment: any } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setTestingConnection(true);
      const status = await testApiConnection();
      setConnectionStatus(status);
      console.log('Status da conexão:', status);
    } catch (error) {
      console.error('Falha ao verificar conexão:', error);
      setConnectionStatus({ status: 'offline', environment: {} });
    } finally {
      setTestingConnection(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      toast({
        title: data.status === 'success' ? 'Conexão bem-sucedida' : 'Falha na conexão',
        description: data.message,
        variant: data.status === 'success' ? 'default' : 'destructive',
      });
      
      checkConnection();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível testar a conexão',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const testPing = async () => {
    try {
      setTestingConnection(true);
      const response = await fetch('/api/ping');
      const text = await response.text();
      
      let isJson = false;
      try {
        JSON.parse(text);
        isJson = true;
      } catch (e) {
        isJson = false;
      }
      
      toast({
        title: response.ok ? 'Ping bem-sucedido' : 'Falha no ping',
        description: isJson ? 'Resposta JSON válida recebida' : 'Resposta recebida, mas não é JSON válido',
        variant: response.ok && isJson ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Erro no ping',
        description: 'Não foi possível fazer ping no servidor',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSearchByPlate = async () => {
    if (!plateNumber.trim()) {
      toast({
        title: "Placa não informada",
        description: "Digite a placa do veículo para buscar.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setFoundVehicle(null);
    
    try {
      console.log(`Iniciando busca de veículo com placa: ${plateNumber}`);
      const vehicle = await getVehicleByPlate(plateNumber);
      
      setFoundVehicle(vehicle);
      
      if (!vehicle) {
        setSearchError(`Nenhum veículo encontrado com a placa ${plateNumber}`);
        toast({
          title: "Veículo não encontrado",
          description: `Nenhum veículo encontrado com a placa ${plateNumber}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Veículo encontrado",
          description: `Veículo ${vehicle.DescricaoModelo} encontrado com sucesso.`,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar veículo:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar veículo";
      setSearchError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle 
          title="Status da API" 
          subtitle="Verifique o status da conexão com a API e teste a funcionalidade de busca por placa" 
        />
        
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Status da API
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="font-medium">Status da Conexão:</p>
                  <div className="flex items-center mt-1">
                    {!connectionStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : connectionStatus.status === 'online' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-600">Online</span>
                      </>
                    ) : connectionStatus.status === 'error' ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-amber-600">Erro</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-600">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={checkConnection} variant="outline" size="sm" disabled={testingConnection}>
                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Verificar
                  </Button>
                  <Button onClick={testPing} variant="outline" size="sm" disabled={testingConnection}>
                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Server className="h-4 w-4 mr-2" />}
                    Ping
                  </Button>
                  <Button onClick={testConnection} variant="outline" size="sm" disabled={testingConnection}>
                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                    Testar Banco
                  </Button>
                </div>
              </div>
              
              {connectionStatus && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium mb-1">Detalhes da Conexão:</p>
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">
                    {JSON.stringify(connectionStatus, null, 2)}
                  </pre>
                </div>
              )}
              
              <Alert>
                <AlertTitle>Informações de Inicialização</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Para iniciar o servidor de API, você pode usar um dos seguintes comandos:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Ambiente completo: <code className="bg-muted px-1 py-0.5 rounded">node start-dev.js</code></li>
                    <li>Apenas API: <code className="bg-muted px-1 py-0.5 rounded">node run-api-server.js</code></li>
                  </ul>
                  <p className="mt-2 text-sm">Endpoints para teste:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Status da API: <code className="bg-muted px-1 py-0.5 rounded">/api/status</code></li>
                    <li>Testar conexão: <code className="bg-muted px-1 py-0.5 rounded">/api/test-connection</code></li>
                    <li>Ping: <code className="bg-muted px-1 py-0.5 rounded">/api/ping</code></li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Teste de Busca por Placa
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Digite a placa (ex: ABC1234)" 
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchByPlate();
                    }
                  }}
                />
                <Button 
                  onClick={handleSearchByPlate} 
                  disabled={isSearching || !plateNumber.trim()}
                >
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>
              
              {isSearching && (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <p>Buscando veículo...</p>
                </div>
              )}
              
              {searchError && !isSearching && !foundVehicle && (
                <Alert variant="destructive">
                  <AlertTitle>Erro na busca</AlertTitle>
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}
              
              {foundVehicle && !isSearching && (
                <div className="border rounded-lg p-4 mt-4 bg-muted/20">
                  <h3 className="font-medium text-lg mb-2">{foundVehicle.DescricaoModelo}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Placa</p>
                      <p className="font-medium">{foundVehicle.Placa}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ano</p>
                      <p className="font-medium">{foundVehicle.AnoFabricacaoModelo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cor</p>
                      <p className="font-medium">{foundVehicle.Cor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Combustível</p>
                      <p className="font-medium">{foundVehicle.TipoCombustivel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Odômetro</p>
                      <p className="font-medium">{foundVehicle.OdometroAtual.toLocaleString('pt-BR')} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor de Compra</p>
                      <p className="font-medium">R$ {foundVehicle.ValorCompra.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grupo</p>
                      <p className="font-medium">{foundVehicle.LetraGrupo}</p>
                    </div>
                  </div>
                  <pre className="mt-4 bg-muted p-2 rounded-md text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(foundVehicle, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ApiStatus;
