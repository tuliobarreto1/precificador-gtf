import React, { useState, useEffect } from 'react';
import { ArrowRight, Car, Search, Loader2, AlertTriangle, Database, RefreshCw, Plus, Check, X, Menu, Fuel } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  getVehicleByPlate, 
  SqlVehicle, 
  testApiConnection, 
  getVehicleGroups, 
  SqlVehicleGroup, 
  getVehicleModelsByGroup, 
  SqlVehicleModel 
} from '@/lib/sql-connection';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { Vehicle, VehicleGroup } from '@/lib/mock-data';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
type FuelType = 'Gasolina' | 'Flex' | 'Diesel';

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
  
  const [vehicleGroups, setVehicleGroups] = useState<SqlVehicleGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [vehicleModels, setVehicleModels] = useState<SqlVehicleModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SqlVehicleModel | null>(null);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  
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

  useEffect(() => {
    const loadVehicleGroups = async () => {
      if (vehicleType === 'new') {
        try {
          setLoadingGroups(true);
          const groups = await getVehicleGroups();
          setVehicleGroups(groups);
          console.log('Grupos de veículos carregados:', groups);
        } catch (error) {
          console.error('Erro ao carregar grupos de veículos:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os grupos de veículos.",
            variant: "destructive",
          });
        } finally {
          setLoadingGroups(false);
        }
      }
    };
    
    loadVehicleGroups();
  }, [vehicleType, toast]);
  
  useEffect(() => {
    const loadVehicleModels = async () => {
      if (selectedGroup) {
        try {
          setLoadingModels(true);
          setSelectedModel(null);
          const models = await getVehicleModelsByGroup(selectedGroup);
          setVehicleModels(models);
          console.log('Modelos de veículos carregados:', models);
        } catch (error) {
          console.error('Erro ao carregar modelos de veículos:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os modelos de veículos.",
            variant: "destructive",
          });
        } finally {
          setLoadingModels(false);
        }
      }
    };
    
    loadVehicleModels();
  }, [selectedGroup, toast]);
  
  useEffect(() => {
    if (selectedModel) {
      setCustomPrice(selectedModel.MaiorValorCompra || 0);
    } else {
      setCustomPrice(null);
    }
  }, [selectedModel]);

  const handleVehicleTypeChange = (value: string) => {
    setVehicleType(value as VehicleType);
    setFoundVehicle(null);
    setSearchError(null);
    setSelectedGroup(null);
    setSelectedModel(null);
    setCustomPrice(null);
    setSelectedFuelType(null);
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
    
    const mappedVehicle: Vehicle = {
      id: `used-${foundVehicle.Placa}`,
      brand: foundVehicle.DescricaoModelo.split(' ')[0],
      model: foundVehicle.DescricaoModelo.split(' ').slice(1).join(' '),
      year: parseInt(foundVehicle.AnoFabricacaoModelo) || new Date().getFullYear(),
      value: foundVehicle.ValorCompra || 0,
      isUsed: true,
      plateNumber: foundVehicle.Placa,
      color: foundVehicle.Cor || '',
      odometer: foundVehicle.OdometroAtual || 0,
      fuelType: foundVehicle.TipoCombustivel || '',
      groupId: foundVehicle.LetraGrupo || 'A',
    };
    
    console.log('Veículo mapeado para adicionar:', mappedVehicle);
    
    const mappedGroup: VehicleGroup = {
      id: foundVehicle.LetraGrupo || 'A',
      name: `Grupo ${foundVehicle.LetraGrupo || 'A'}`,
      description: foundVehicle.DescricaoGrupo || `Veículos do grupo ${foundVehicle.LetraGrupo || 'A'}`,
      revisionKm: 10000,
      revisionCost: 500,
      tireKm: 40000,
      tireCost: 2000
    };
    
    onSelectVehicle(mappedVehicle, mappedGroup);
    
    setFoundVehicle(null);
    setPlateNumber('');
    toast({
      title: "Veículo adicionado",
      description: `${foundVehicle.DescricaoModelo} (${foundVehicle.Placa}) foi adicionado à cotação.`,
    });
  };

  const handleSelectNewVehicle = () => {
    if (!selectedModel) {
      toast({
        title: "Modelo não selecionado",
        description: "Selecione um modelo de veículo para adicionar à cotação.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFuelType) {
      toast({
        title: "Tipo de combustível não selecionado",
        description: "Selecione o tipo de combustível do veículo.",
        variant: "destructive",
      });
      return;
    }
    
    const finalPrice = customPrice !== null ? customPrice : selectedModel.MaiorValorCompra;
    
    const mappedVehicle: Vehicle = {
      id: `new-${selectedModel.CodigoModelo}`,
      brand: selectedModel.Descricao.split(' ')[0],
      model: selectedModel.Descricao.split(' ').slice(1).join(' '),
      year: new Date().getFullYear(),
      value: finalPrice,
      isUsed: false,
      groupId: selectedModel.LetraGrupo,
      fuelType: selectedFuelType
    };
    
    const mappedGroup: VehicleGroup = {
      id: selectedModel.LetraGrupo,
      name: `Grupo ${selectedModel.LetraGrupo}`,
      description: `Veículos do grupo ${selectedModel.LetraGrupo}`,
      revisionKm: 10000,
      revisionCost: 500,
      tireKm: 40000,
      tireCost: 2000
    };
    
    onSelectVehicle(mappedVehicle, mappedGroup);
    
    toast({
      title: "Veículo adicionado",
      description: `${selectedModel.Descricao} foi adicionado à cotação.`,
    });
    
    setSelectedModel(null);
    setCustomPrice(null);
    setSelectedFuelType(null);
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
                          {`PORT=3002
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
        <div className="space-y-6 border p-4 rounded-lg">
          <h3 className="text-base font-medium">Selecionar veículo novo por grupo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="group" className="mb-2 block">Grupo de Veículos</Label>
              <Select 
                onValueChange={(value) => setSelectedGroup(value)}
                value={selectedGroup || undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {loadingGroups ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Carregando grupos...</span>
                    </div>
                  ) : (
                    vehicleGroups.map(group => (
                      <SelectItem key={group.CodigoGrupo} value={group.Letra}>
                        Grupo {group.Letra} - {group.Descricao}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="model" className="mb-2 block">Modelo de Veículo</Label>
              <Select 
                onValueChange={(value) => {
                  const model = vehicleModels.find(m => m.CodigoModelo === value);
                  setSelectedModel(model || null);
                }}
                value={selectedModel?.CodigoModelo || undefined}
                disabled={!selectedGroup || loadingModels}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {loadingModels ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Carregando modelos...</span>
                    </div>
                  ) : (
                    vehicleModels.map(model => (
                      <SelectItem key={model.CodigoModelo} value={model.CodigoModelo}>
                        {model.Descricao}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedModel && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{selectedModel.Descricao}</h3>
                  <p className="text-sm text-muted-foreground">
                    Grupo {selectedModel.LetraGrupo} • {new Date().getFullYear()}
                  </p>
                </div>
                <div className="text-right">
                  <Label htmlFor="custom-price" className="text-xs text-muted-foreground">Valor de compra (R$)</Label>
                  <Input
                    id="custom-price"
                    type="number"
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-40 mt-1"
                    placeholder="Valor de compra"
                  />
                  
                  <div className="mt-3">
                    <Label htmlFor="fuel-type" className="text-xs text-muted-foreground">Tipo de Combustível</Label>
                    <Select 
                      onValueChange={(value) => setSelectedFuelType(value as FuelType)}
                      value={selectedFuelType || undefined}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Selecione o combustível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gasolina">Gasolina</SelectItem>
                        <SelectItem value="Flex">Flex</SelectItem>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleSelectNewVehicle}
                    className="mt-3"
                    size="sm"
                    disabled={!customPrice || !selectedFuelType}
                  >
                    Adicionar <Plus className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Selecione um grupo e depois um modelo de veículo para adicionar à cotação.
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
