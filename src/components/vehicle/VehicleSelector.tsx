
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { testApiConnection } from '@/lib/sql-connection';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { SqlVehicle, SqlVehicleModel } from '@/lib/sql-connection';

// Componentes refatorados
import ConnectionStatusAlert from './ConnectionStatusAlert';
import VehicleTypeSelector from './VehicleTypeSelector';
import SelectedVehiclesList from './SelectedVehiclesList';
import UsedVehicleSearch from './UsedVehicleSearch';
import NewVehicleSelector from './NewVehicleSelector';

type VehicleSelectorProps = {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  selectedVehicles: Vehicle[];
  onRemoveVehicle?: (vehicleId: string) => void;
  onError?: (errorMessage: string | null) => void;
  offlineMode?: boolean;
};

type VehicleType = 'new' | 'used';

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  onSelectVehicle, 
  selectedVehicles,
  onRemoveVehicle,
  onError,
  offlineMode = false
}) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('new');
  const [connectionStatus, setConnectionStatus] = useState<{ status: string; environment: any } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (!offlineMode) {
      checkConnection();
    } else {
      // Se estamos em modo offline, definimos o status diretamente
      setConnectionStatus({ status: 'offline', environment: {} });
      console.log('Modo offline ativado');
      
      if (onError) {
        onError('Modo offline ativado. Usando dados do cache local.');
      }
    }
  }, [offlineMode, onError]);

  const checkConnection = async () => {
    try {
      setTestingConnection(true);
      const status = await testApiConnection();
      setConnectionStatus(status);
      console.log('Status da conexão:', status);
      if (onError && status?.status !== 'online') {
        onError(`Problemas na conexão com o banco de dados: ${status?.status || 'offline'}`);
      } else if (onError) {
        onError(null);
      }
    } catch (error) {
      console.error('Falha ao verificar conexão:', error);
      setConnectionStatus({ status: 'offline', environment: {} });
      setDetailedError(error instanceof Error ? error.message : 'Erro desconhecido ao verificar conexão');
      if (onError) {
        onError('Falha ao verificar conexão com o banco de dados');
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      setTestingConnection(true);
      setDetailedError(null);
      if (onError) onError(null);
      
      const response = await fetch('/api/test-connection');
      let data;
      
      try {
        data = await response.json();
        setDiagnosticInfo(data);
      } catch (jsonError) {
        const textResponse = await response.text();
        setDetailedError(`Erro ao analisar resposta JSON: ${textResponse}`);
        setDiagnosticInfo({ error: "Falha ao analisar resposta", textResponse });
        if (onError) onError("Falha ao analisar resposta do servidor");
        
        toast({
          title: "Erro na resposta",
          description: "A resposta do servidor não está no formato esperado.",
          variant: "destructive",
        });
        return;
      }
      
      if (response.ok) {
        if (onError) onError(null);
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
        const errorMsg = data.message || "Não foi possível conectar ao banco de dados.";
        if (onError) onError(errorMsg);
        
        toast({
          title: "Falha na conexão",
          description: errorMsg,
          variant: "destructive",
        });
        console.error('Teste de conexão falhou:', data);
        setDetailedError(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao testar conexão';
      if (onError) onError(errorMsg);
      
      toast({
        title: "Erro",
        description: "Erro ao tentar testar a conexão com o banco de dados.",
        variant: "destructive",
      });
      setDetailedError(errorMsg);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleVehicleTypeChange = (value: string) => {
    setVehicleType(value as VehicleType);
  };

  const handleSelectFoundVehicle = (foundVehicle: SqlVehicle) => {
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
    
    toast({
      title: "Veículo adicionado",
      description: `${foundVehicle.DescricaoModelo} (${foundVehicle.Placa}) foi adicionado à cotação.`,
    });
  };

  const handleSelectNewVehicle = (
    selectedModel: SqlVehicleModel, 
    quantity: number, 
    customPrice: number, 
    selectedFuelType: string
  ) => {
    // Adicionar a quantidade de veículos selecionada
    for (let i = 0; i < quantity; i++) {
      // Garantimos que cada veículo tenha um ID único usando timestamp + índice
      const uniqueId = `new-${selectedModel.CodigoModelo}-${i}-${Date.now()}`;
      
      const mappedVehicle: Vehicle = {
        id: uniqueId,
        brand: selectedModel.Descricao.split(' ')[0],
        model: selectedModel.Descricao.split(' ').slice(1).join(' '),
        year: new Date().getFullYear(),
        value: customPrice,
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
    }
    
    toast({
      title: "Veículos adicionados",
      description: `${quantity} ${quantity > 1 ? 'veículos' : 'veículo'} ${selectedModel.Descricao} ${quantity > 1 ? 'foram adicionados' : 'foi adicionado'} à cotação.`,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <ConnectionStatusAlert
        status={connectionStatus?.status as 'online' | 'offline' | 'checking'}
        offlineMode={offlineMode}
        testingConnection={testingConnection}
        error={onError ? null : null} // Passamos os erros via onError
        detailedError={detailedError}
        diagnosticInfo={diagnosticInfo}
        onTestConnection={testDatabaseConnection}
      />
      
      {detailedError && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm mb-4 overflow-auto max-h-48">
          <p className="font-semibold">Detalhes do erro:</p>
          <pre className="whitespace-pre-wrap mt-1">{detailedError}</pre>
        </div>
      )}
      
      <VehicleTypeSelector 
        value={vehicleType}
        onChange={handleVehicleTypeChange}
      />

      <SelectedVehiclesList 
        vehicles={selectedVehicles}
        onRemove={onRemoveVehicle}
      />

      {vehicleType === 'used' && (
        <UsedVehicleSearch 
          onSelectVehicle={handleSelectFoundVehicle}
          offlineMode={offlineMode}
          onError={onError}
        />
      )}

      {vehicleType === 'new' && (
        <NewVehicleSelector 
          onSelectVehicle={handleSelectNewVehicle}
          offlineMode={offlineMode}
        />
      )}
    </div>
  );
};

export default VehicleSelector;
