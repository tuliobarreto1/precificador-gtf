
import React, { useState } from 'react';
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
      <VehicleSelector 
        onSelectVehicle={onSelectVehicle}
        onRemoveVehicle={onRemoveVehicle}
        selectedVehicles={selectedVehicles as Vehicle[]}
        onError={handleVehicleSelectorError}
        offlineMode={effectiveOfflineMode}
      />
    </div>
  );
};

export default VehicleStep;
