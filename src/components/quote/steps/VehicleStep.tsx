
import React from 'react';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import { Vehicle, VehicleGroup } from '@/lib/models';

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
  return (
    <VehicleSelector 
      onSelectVehicle={onSelectVehicle}
      selectedVehicles={selectedVehicles}
      onRemoveVehicle={onRemoveVehicle}
    />
  );
};

export default VehicleStep;
