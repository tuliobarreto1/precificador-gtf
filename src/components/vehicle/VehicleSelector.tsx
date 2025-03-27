import React, { useState, useEffect } from 'react';
import { ArrowRight, Car, Search, Loader2, AlertTriangle, Database, RefreshCw, Plus, Check, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getVehicleByPlate, SqlVehicle, testApiConnection } from '@/lib/sql-connection';
import { vehicles, vehicleGroups, getVehicleGroupById } from '@/lib/mock-data';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { Vehicle, VehicleGroup } from '@/lib/mock-data';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type VehicleSelectorProps = {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  selectedVehicles: Vehicle[];
  onRemoveVehicle?: (vehicleId: string) => void;
};

type VehicleType = 'new' | 'used';

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  onSelectVehicle, 
  selectedVehicles,
  onRemoveVehicle 
}) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('new');
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundVehicle, setFoundVehicle] = useState<SqlVehicle | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; environment: any } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [showDiagnosticInfo, setShowDiagnosticInfo] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setTestingConnection(true);
        const status = await testApiConnection();
        setConnectionStatus(status);
        console.log('Status da conexão:', status);
      } catch (error) {
        console.error('Falha ao verificar conexão:', error);
        setConnectionStatus({ status: 'offline', environment: {} });
        setDetailedError(error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão');
      } finally {
        setTestingConnection(false);
      }
    };
    
    checkConnection();
  }, []);

  const handleVehicleTypeChange = (value: string) => {
    setVehicleType(value as VehicleType);
    setFoundVehicle(null);
    setSearchError(null);
  };

  const testDatabaseConnection = async () => {
    try {
      setTestingConnection(true);
      setDetailedError(null);
      
      const response = await fetch('/api/test-connection');
      let data;
      
      try {
        data = await response.json();
        setDiagnosticInfo(data);
      } catch (jsonError) {
        const textResponse = await response.text();
        setDetailedError(`Erro ao analisar resposta JSON: ${textResponse}`);
        setDiagnosticInfo({ error: "Falha ao analisar resposta", textResponse });
        
        toast({
          title: "Erro na resposta",
          description: "A resposta do servidor não está no formato esperado.",
          variant: "destructive",
        });
        return;
      }
      
      if (response.ok) {
        toast({
          title: "Conexão bem-sucedida",
          description: "A conexão com o banco de dados foi estabelecida com sucesso.",
        });
        console.log('Teste de conexão bem-sucedido:', data);
        setConnectionStatus({ 
          status: 'online', 
          environment: data.config || {} 
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.message || "Não foi possível conectar ao banco de dados.",
          variant: "destructive",
        });
        console.error('Teste de conexão falhou:', data);
        setDetailedError(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast({
        title: "Erro",
        description: "Erro ao tentar testar a conexão com o banco de dados.",
        variant: "destructive",
      });
      setDetailedError(error instanceof Error ? error.message : 'Erro desconhecido ao testar conexão');
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
    setDetailedError(null);
    
    try {
      console.log(`Iniciando busca de veículo com placa: ${plateNumber}`);
      const vehicle = await getVehicleByPlate(plateNumber);
      console.log('Resultado da busca:', vehicle);
      
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
      
      if (error instanceof Error && error.message.includes('Unexpected end of JSON')) {
        setDetailedError("Erro na resposta do servidor: formato JSON inválido. Verifique os logs do servidor para mais detalhes.");
      } else {
        setDetailedError(JSON.stringify(error, null, 2));
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFoundVehicle = () => {
    if (!foundVehicle) return;
    
    console.log('Selecionando veículo encontrado:', foundVehicle);
    
    const foundVehicleGroup = vehicleGroups.find(g => g.id === foundVehicle.LetraGrupo) || vehicleGroups[0];
    
    const mappedVehicle: Vehicle = {
      id: `used-${foundVehicle.Placa}`,
      brand: foundVehicle.DescricaoModelo.split(' ')[0],
      model: foundVehicle.DescricaoModelo.split(' ').slice(1).join(' '),
      year: parseInt(foundVehicle.AnoFabricacaoModelo),
      value: foundVehicle.ValorCompra,
      groupId: foundVehicleGroup.id,
      isUsed: true,
      plateNumber: foundVehicle.Placa,
      color: foundVehicle.Cor,
      odometer: foundVehicle.OdometroAtual
    };
    
    onSelectVehicle(mappedVehicle, foundVehicleGroup);
    
    setFoundVehicle(null);
    setPlateNumber('');
    toast({
      title: "Veículo adicionado",
      description: `${foundVehicle.DescricaoModelo} (${foundVehicle.Placa}) foi adicionado à cotação.`,
    });
  };

  const isVehicleSelected = (vehicleId: string) => {
    return selectedVehicles.some(v => v.id === vehicleId);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {connectionStatus && connectionStatus.status !== 'online' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção: Problemas de conexão com o servidor</AlertTitle>
          <AlertDescription>
            <p>A conexão com o servidor de banco de dados pode estar indisponível.</p>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={testDatabaseConnection} 
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
                          {`PORT=3001
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
                        {connectionStatus && (
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                            {JSON.stringify(connectionStatus, null, 2)}
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
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Fechar</AlertDialogCancel>
                    <AlertDialogAction onClick={testDatabaseConnection}>
                      {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                      Testar Conexão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {detailedError && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm mb-4 overflow-auto max-h-48">
          <p className="font-semibold">Detalhes do erro:</p>
          <pre className="whitespace-pre-wrap mt-1">{detailedError}</pre>
        </div>
      )}
      
      <div className="bg-muted/30 p-4 rounded-lg">
        <RadioGroup 
          value={vehicleType} 
          onValueChange={handleVehicleTypeChange}
          className="flex space-x-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="vehicle-new" />
            <Label htmlFor="vehicle-new" className="font-medium cursor-pointer">
              Veículo Novo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="used" id="vehicle-used" />
            <Label htmlFor="vehicle-used" className="font-medium cursor-pointer">
              Veículo Usado
            </Label>
          </div>
        </RadioGroup>
      </div>

      {selectedVehicles.length > 0 && (
        <div className="border p-4 rounded-lg bg-primary/5">
          <h3 className="text-base font-medium mb-3">Veículos Selecionados ({selectedVehicles.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedVehicles.map(vehicle => (
              <Badge 
                key={vehicle.id} 
                variant="secondary"
                className="py-2 pl-3 pr-2 flex items-center gap-1"
              >
                <span>
                  {vehicle.brand} {vehicle.model} 
                  {vehicle.plateNumber && ` (${vehicle.plateNumber})`}
                </span>
                {onRemoveVehicle && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={() => onRemoveVehicle(vehicle.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {vehicleType === 'used' && (
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="text-base font-medium">Buscar veículo usado por placa</h3>
          
          <div className="flex items-center gap-2">
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
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>
          
          {isSearching && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Buscando veículo...</p>
            </div>
          )}
          
          {searchError && !isSearching && !foundVehicle && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
              {searchError}
            </div>
          )}
          
          {foundVehicle && !isSearching && (
            <div className="border rounded-lg p-4 mt-4 bg-muted/20">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{foundVehicle.DescricaoModelo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {foundVehicle.AnoFabricacaoModelo} • Placa: {foundVehicle.Placa}
                  </p>
                  <div className="mt-2 text-sm">
                    <p>Cor: {foundVehicle.Cor}</p>
                    <p>Combustível: {foundVehicle.TipoCombustivel}</p>
                    <p>Grupo: {foundVehicle.LetraGrupo}</p>
                    <p>Odômetro: {foundVehicle.OdometroAtual.toLocaleString('pt-BR')} km</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {foundVehicle.ValorCompra.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Valor de compra</p>
                  <Button 
                    onClick={handleSelectFoundVehicle}
                    className="mt-3"
                    size="sm"
                  >
                    Adicionar <Plus className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Digite a placa no formato correto (ex: ABC1234)
          </p>
        </div>
      )}

      {vehicleType === 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.filter(v => !v.isUsed).map((vehicle) => {
            const group = getVehicleGroupById(vehicle.groupId);
            if (!group) return null;
            
            const isSelected = isVehicleSelected(vehicle.id);
            
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                vehicleGroup={group}
                isSelected={isSelected}
                onClick={() => {
                  if (!isSelected) {
                    onSelectVehicle(vehicle, group);
                  }
                }}
                className={isSelected ? 'cursor-default' : ''}
              >
                {isSelected ? (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> Selecionado
                    </Badge>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    className="absolute bottom-4 right-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVehicle(vehicle, group);
                    }}
                  >
                    Adicionar <Plus className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </VehicleCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
