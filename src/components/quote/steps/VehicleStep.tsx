
import React, { useState, useEffect } from 'react';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { testApiConnection } from '@/lib/sql-connection';

interface VehicleStepProps {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  onRemoveVehicle: (vehicleId: string) => void;
  selectedVehicles: Vehicle[];
}

const VehicleStep: React.FC<VehicleStepProps> = ({ 
  onSelectVehicle, 
  onRemoveVehicle,
  selectedVehicles
}) => {
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const { toast } = useToast();

  // Verificar status da conexão ao montar o componente
  useEffect(() => {
    checkConnection();
  }, []);

  // Função para verificar a conexão com o banco de dados
  const checkConnection = async () => {
    try {
      setIsChecking(true);
      setConnectionStatus('checking');
      
      console.log("Verificando status da conexão com o banco de dados...");
      const result = await testApiConnection();
      
      if (result && result.status === 'online') {
        setConnectionStatus('online');
        setError(null);
      } else {
        setConnectionStatus('offline');
        setError(result?.error || 'Não foi possível conectar ao banco de dados');
      }
    } catch (err) {
      console.error("Erro ao verificar conexão:", err);
      setConnectionStatus('offline');
      setError('Erro ao tentar conectar ao banco de dados');
    } finally {
      setIsChecking(false);
    }
  };

  // Função para tentar novamente após erro
  const handleRetry = () => {
    setError(null);
    checkConnection();
    toast({
      title: "Reconectando...",
      description: "Tentando estabelecer conexão com o banco de dados novamente."
    });
  };

  // Lidar com erros no VehicleSelector
  const handleVehicleSelectorError = (errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage && errorMessage.includes('timeout') || errorMessage.includes('conectar')) {
      setConnectionStatus('offline');
    }
  };

  return (
    <div className="space-y-4">
      {connectionStatus === 'offline' && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Problema de conexão com o banco de dados</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>O servidor de banco de dados não está respondendo. Você pode continuar usando dados do cache local ou tentar reconectar.</p>
            {error && <p className="text-sm font-mono bg-destructive/10 p-2 rounded">{error}</p>}
            <div className="flex justify-end mt-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={isChecking}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} /> 
                {isChecking ? 'Verificando...' : 'Tentar novamente'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  toast({
                    title: "Modo offline ativado",
                    description: "Usando dados do cache local. Algumas funcionalidades podem estar limitadas."
                  });
                }}
              >
                <Database className="h-4 w-4" /> 
                Usar modo offline
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <VehicleSelector 
        onSelectVehicle={onSelectVehicle}
        selectedVehicles={selectedVehicles}
        onRemoveVehicle={onRemoveVehicle}
        onError={handleVehicleSelectorError}
        offlineMode={connectionStatus === 'offline'}
      />
    </div>
  );
};

export default VehicleStep;
