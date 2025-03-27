
import React, { useState, useEffect } from 'react';
import { ArrowRight, Car, Search, Loader2, AlertTriangle, Database } from 'lucide-react';
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

type VehicleSelectorProps = {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  selectedVehicleId?: string | null;
};

type VehicleType = 'new' | 'used';

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ onSelectVehicle, selectedVehicleId }) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('new');
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundVehicle, setFoundVehicle] = useState<SqlVehicle | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; environment: any } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const { toast } = useToast();

  // Testar a conexão com a API ao montar o componente
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
      
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Conexão bem-sucedida",
          description: "A conexão com o banco de dados foi estabelecida com sucesso.",
        });
        console.log('Teste de conexão bem-sucedido:', data);
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
      setDetailedError(JSON.stringify(error, null, 2));
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
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Status da conexão */}
      {connectionStatus && connectionStatus.status !== 'online' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção: Problemas de conexão com o servidor</AlertTitle>
          <AlertDescription>
            A conexão com o servidor de banco de dados pode estar indisponível.
            <Button 
              onClick={testDatabaseConnection} 
              variant="outline" 
              size="sm" 
              className="mt-2"
              disabled={testingConnection}
            >
              {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Testar Conexão
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Exibir mensagem de erro detalhada se existir */}
      {detailedError && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm mb-4 overflow-auto max-h-48">
          <p className="font-semibold">Detalhes do erro:</p>
          <pre className="whitespace-pre-wrap mt-1">{detailedError}</pre>
        </div>
      )}
      
      {/* Selector de tipo de veículo */}
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
                    Selecionar <ArrowRight className="ml-1 h-4 w-4" />
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

      {/* Veículos novos */}
      {vehicleType === 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.filter(v => !v.isUsed).map((vehicle) => {
            const group = getVehicleGroupById(vehicle.groupId);
            if (!group) return null;
            
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                vehicleGroup={group}
                isSelected={selectedVehicleId === vehicle.id}
                onClick={() => onSelectVehicle(vehicle, group)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
