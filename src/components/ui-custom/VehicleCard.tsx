
import React from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vehicle, VehicleGroup } from '@/lib/mock-data';

type VehicleCardProps = {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
};

const VehicleCard = ({ 
  vehicle, 
  vehicleGroup, 
  isSelected = false, 
  onClick, 
  className 
}: VehicleCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border p-4 transition-all duration-200",
        "hover:shadow-md hover:border-primary/30 cursor-pointer",
        isSelected && "border-primary/70 ring-1 ring-primary/30 shadow-md",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Car className="text-primary" size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.isUsed && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Usado
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {vehicle.year} • Grupo {vehicleGroup.id}
          </p>
        </div>
        
        <div className="text-right">
          <p className="font-medium">R$ {vehicle.value.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor do veículo</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">Revisão:</p>
          <p>A cada {vehicleGroup.revisionKm.toLocaleString('pt-BR')} km</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pneus:</p>
          <p>A cada {vehicleGroup.tireKm.toLocaleString('pt-BR')} km</p>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
