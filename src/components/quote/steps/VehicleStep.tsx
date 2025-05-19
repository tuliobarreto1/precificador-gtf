
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
}

const VehicleStep: React.FC<VehicleStepProps> = ({ 
  onSelectVehicle, 
  onRemoveVehicle,
  selectedVehicles
}) => {
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Lidar com erros no VehicleSelector
  const handleVehicleSelectorError = (errorMessage: string | null) => {
    setError(errorMessage);
  };

  // Ativar modo offline
  const enableOfflineMode = () => {
    setOfflineMode(true);
    toast({
      title: "Modo offline ativado",
      description: "Usando dados do cache local. Algumas funcionalidades podem estar limitadas."
    });
  };

  return (
    <div className="space-y-4">
      <VehicleSelector 
        onSelectVehicle={onSelectVehicle}
        onRemoveVehicle={onRemoveVehicle}
        selectedVehicles={selectedVehicles}
        onError={handleVehicleSelectorError}
        offlineMode={offlineMode}
      />
    </div>
  );
};

export default VehicleStep;
