
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuote } from '@/context/QuoteContext';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { useToast } from '@/hooks/use-toast';

interface VehicleStepProps {
  onNext: () => void;
  offlineMode?: boolean;
  onOfflineModeChange?: (enabled: boolean) => void;
}

const VehicleStep: React.FC<VehicleStepProps> = ({ onNext, offlineMode = false, onOfflineModeChange }) => {
  const { quoteForm, addVehicle, removeVehicle } = useQuote();
  const { toast } = useToast();
  
  // Manipulador para adicionar um veículo à cotação
  const handleSelectVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    addVehicle(vehicle, vehicleGroup);
    toast({
      title: "Veículo adicionado",
      description: `${vehicle.brand} ${vehicle.model} foi adicionado à cotação.`,
    });
  };
  
  // Manipulador para remover um veículo da cotação
  const handleRemoveVehicle = (vehicleId: string) => {
    removeVehicle(vehicleId);
    toast({
      title: "Veículo removido",
      description: "O veículo foi removido da cotação.",
      variant: "destructive",
    });
  };
  
  // Manipulador para mensagens de erro do seletor de veículos
  const handleVehicleSelectorError = (errorMessage: string | null) => {
    if (errorMessage) {
      toast({
        title: "Erro ao buscar veículos",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <VehicleSelector 
          onSelectVehicle={handleSelectVehicle}
          selectedVehicles={quoteForm.vehicles.map(item => item.vehicle)}
          onRemoveVehicle={handleRemoveVehicle}
          onError={handleVehicleSelectorError}
          offlineMode={offlineMode}
          onOfflineModeChange={onOfflineModeChange}
        />
        
        <div className="flex justify-end mt-6">
          <Button 
            onClick={onNext}
            disabled={!quoteForm.vehicles.length}
            className="flex items-center"
          >
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStep;
