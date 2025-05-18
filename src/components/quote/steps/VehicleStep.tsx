
import React, { useState } from 'react';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Função para tentar novamente após erro
  const handleRetry = () => {
    setError(null);
    toast({
      title: "Reconectando...",
      description: "Tentando estabelecer conexão com o banco de dados novamente."
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erro de conexão</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <div className="flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <VehicleSelector 
        onSelectVehicle={onSelectVehicle}
        selectedVehicles={selectedVehicles}
        onRemoveVehicle={onRemoveVehicle}
        onError={setError}
      />
    </div>
  );
};

export default VehicleStep;
