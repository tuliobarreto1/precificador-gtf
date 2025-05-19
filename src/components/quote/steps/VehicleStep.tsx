
import React, { useState } from 'react';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import { VehicleGroup } from '@/lib/models';
import { Vehicle as ContextVehicle } from '@/context/types/quoteTypes';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { testApiConnection } from '@/lib/sql-connection';
import SelectedVehiclesList from '@/components/vehicle/SelectedVehiclesList';

interface VehicleStepProps {
  onSelectVehicle: (vehicle: any, vehicleGroup: VehicleGroup) => void;
  onRemoveVehicle: (vehicleId: string) => void;
  selectedVehicles: any[];
  offlineMode?: boolean;
  onOfflineModeChange?: (mode: boolean) => void;
}

const VehicleStep: React.FC<VehicleStepProps> = ({ 
  onSelectVehicle, 
  onRemoveVehicle,
  selectedVehicles,
  offlineMode = false,
  onOfflineModeChange
}) => {
  const [error, setError] = useState<string | null>(null);
  const [localOfflineMode, setLocalOfflineMode] = useState<boolean>(offlineMode);
  const { toast } = useToast();
  
  // Lidar com erros no VehicleSelector
  const handleVehicleSelectorError = (errorMessage: string | null) => {
    setError(errorMessage);
  };

  // Ativar modo offline
  const enableOfflineMode = () => {
    setLocalOfflineMode(true);
    if (onOfflineModeChange) {
      onOfflineModeChange(true);
    }
    toast({
      title: "Modo offline ativado",
      description: "Usando dados do cache local. Algumas funcionalidades podem estar limitadas."
    });
  };

  // Usar valor do prop ou estado local
  const effectiveOfflineMode = typeof offlineMode === 'boolean' ? offlineMode : localOfflineMode;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={enableOfflineMode}
                className="flex items-center gap-1"
              >
                <Database className="h-4 w-4" />
                Usar modo offline
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {selectedVehicles.length > 0 && (
        <SelectedVehiclesList 
          vehicles={selectedVehicles} 
          onRemove={onRemoveVehicle} 
        />
      )}
      
      <VehicleSelector 
        onSelectVehicle={onSelectVehicle}
        onRemoveVehicle={onRemoveVehicle}
        selectedVehicles={selectedVehicles}
        onError={handleVehicleSelectorError}
        offlineMode={effectiveOfflineMode}
      />
    </div>
  );
};

export default VehicleStep;
