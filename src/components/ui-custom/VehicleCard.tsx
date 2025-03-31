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
  isUsed: boolean;
  plateNumber?: string;
  groupId?: string;
  color?: string;
  odometer?: number;
  fuelType?: string;
}

export interface VehicleCardProps {
  vehicle: Vehicle;
  showRemoveButton?: boolean;
  onRemoveVehicle?: (id: string) => void;
  showDetailedInfo?: boolean;
  showCosts?: boolean;
  children?: React.ReactNode;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  showRemoveButton = false, 
  onRemoveVehicle,
  showDetailedInfo = false,
  showCosts = false,
  children
}) => {
  const handleRemove = () => {
    if (onRemoveVehicle) {
      onRemoveVehicle(vehicle.id);
    }
  };

  const vehicleData = {
    brand: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).brand : vehicle.brand,
    model: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).model : vehicle.model,
    year: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).year : vehicle.year,
    value: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).value : vehicle.value,
    plateNumber: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).plateNumber || (vehicle.vehicle as any).plate_number : vehicle.plateNumber,
    isUsed: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).isUsed || (vehicle.vehicle as any).is_used : vehicle.isUsed,
    color: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).color : vehicle.color,
    odometer: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).odometer : vehicle.odometer,
    fuelType: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).fuelType || (vehicle.vehicle as any).fuel_type : vehicle.fuelType,
    groupId: 'vehicle' in vehicle ? (vehicle.vehicle as Vehicle).groupId || (vehicle.vehicle as any).group_id : vehicle.groupId,
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{vehicleData.brand} {vehicleData.model}</h3>
          <p className="text-sm text-muted-foreground">
            {vehicleData.year} • {vehicleData.isUsed ? 'Usado' : 'Novo'}
          </p>
          {vehicleData.plateNumber && (
            <Badge variant="outline" className="mt-1 bg-primary/10">
              {vehicleData.plateNumber}
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="font-medium">R$ {vehicleData.value.toLocaleString('pt-BR')}</p>
          {vehicle.monthly_value && (
            <p className="text-xs text-muted-foreground">
              Valor mensal: R$ {vehicle.monthly_value.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>
      
      {showDetailedInfo && (vehicleData.groupId || vehicleData.color || vehicleData.odometer || vehicleData.fuelType) && (
        <div className="mt-2 pt-2 border-t text-xs space-y-1">
          {vehicleData.groupId && (
            <p><span className="text-muted-foreground">Grupo:</span> {vehicleData.groupId}</p>
          )}
          {vehicleData.color && (
            <p><span className="text-muted-foreground">Cor:</span> {vehicleData.color}</p>
          )}
          {vehicleData.odometer && (
            <p><span className="text-muted-foreground">Odômetro:</span> {vehicleData.odometer.toLocaleString('pt-BR')} km</p>
          )}
          {vehicleData.fuelType && (
            <p><span className="text-muted-foreground">Combustível:</span> {vehicleData.fuelType}</p>
          )}
        </div>
      )}

      {showCosts && vehicle.depreciation_cost && vehicle.maintenance_cost && (
        <div className="mt-2 pt-2 border-t text-xs space-y-1">
          <p><span className="text-muted-foreground">Depreciação:</span> R$ {(vehicle.depreciation_cost || 0).toLocaleString('pt-BR')}</p>
          <p><span className="text-muted-foreground">Manutenção:</span> R$ {(vehicle.maintenance_cost || 0).toLocaleString('pt-BR')}</p>
          {vehicle.extra_km_rate && (
            <p><span className="text-muted-foreground">Taxa por km excedente:</span> R$ {vehicle.extra_km_rate.toFixed(2)}</p>
          )}
        </div>
      )}

      {children}
      
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
