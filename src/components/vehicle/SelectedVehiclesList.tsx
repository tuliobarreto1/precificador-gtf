
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Vehicle } from '@/lib/models';

interface SelectedVehiclesListProps {
  vehicles: Vehicle[];
  onRemove?: (vehicleId: string) => void;
}

const SelectedVehiclesList: React.FC<SelectedVehiclesListProps> = ({ vehicles, onRemove }) => {
  if (vehicles.length === 0) return null;

  return (
    <div className="border p-4 rounded-lg bg-primary/5">
      <h3 className="text-base font-medium mb-3">Veículos Selecionados ({vehicles.length})</h3>
      <div className="flex flex-wrap gap-2">
        {vehicles.map(vehicle => (
          <Badge 
            key={vehicle.id} 
            variant="secondary"
            className="py-2 pl-3 pr-2 flex items-center gap-1"
          >
            <span>
              {vehicle.brand} {vehicle.model} 
              {vehicle.plateNumber && ` (${vehicle.plateNumber})`}
            </span>
            {onRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5"
                onClick={() => onRemove(vehicle.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default SelectedVehiclesList;
