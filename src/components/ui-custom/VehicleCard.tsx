
import React from 'react';
import { Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  plateNumber?: string;
  isUsed: boolean;
  groupId?: string;
  color?: string;
  odometer?: number;
  fuelType?: string;
}

export interface VehicleCardProps {
  vehicle: Vehicle;
  showRemoveButton?: boolean;
  onRemoveVehicle?: (id: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  showRemoveButton = false, 
  onRemoveVehicle 
}) => {
  const handleRemove = () => {
    if (onRemoveVehicle) {
      onRemoveVehicle(vehicle.id);
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{vehicle.brand} {vehicle.model}</h3>
          <p className="text-sm text-muted-foreground">
            {vehicle.year} • {vehicle.isUsed ? 'Usado' : 'Novo'}
          </p>
          {vehicle.plateNumber && (
            <Badge variant="outline" className="mt-1 bg-primary/10">
              {vehicle.plateNumber}
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="font-medium">R$ {vehicle.value.toLocaleString('pt-BR')}</p>
        </div>
      </div>
      
      {(vehicle.groupId || vehicle.color || vehicle.odometer) && (
        <div className="mt-2 pt-2 border-t text-xs space-y-1">
          {vehicle.groupId && (
            <p><span className="text-muted-foreground">Grupo:</span> {vehicle.groupId}</p>
          )}
          {vehicle.color && (
            <p><span className="text-muted-foreground">Cor:</span> {vehicle.color}</p>
          )}
          {vehicle.odometer && (
            <p><span className="text-muted-foreground">Odômetro:</span> {vehicle.odometer.toLocaleString('pt-BR')} km</p>
          )}
          {vehicle.fuelType && (
            <p><span className="text-muted-foreground">Combustível:</span> {vehicle.fuelType}</p>
          )}
        </div>
      )}
      
      {showRemoveButton && (
        <div className="mt-auto pt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
          >
            <Car className="mr-2 h-4 w-4" />
            Remover Veículo
          </Button>
        </div>
      )}
    </div>
  );
};

export default VehicleCard;
