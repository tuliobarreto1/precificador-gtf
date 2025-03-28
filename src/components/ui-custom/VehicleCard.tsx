
import React from 'react';
import { cn } from '@/lib/utils';
import { Car, Calendar, Gauge, Tag } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value?: number;
  plateNumber?: string;
  plate_number?: string; // Formato do Supabase
  color?: string;
  isUsed?: boolean;
  is_used?: boolean; // Formato do Supabase
  odometer?: number;
  groupId?: string;
  group_id?: string; // Formato do Supabase
}

interface VehicleGroup {
  id: string;
  name?: string;
  description?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  vehicleGroup?: VehicleGroup;
  className?: string;
  children?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  showDetailedInfo?: boolean;
}

const getPlateNumber = (vehicle: Vehicle): string | undefined => {
  return vehicle.plateNumber || vehicle.plate_number;
};

const isVehicleUsed = (vehicle: Vehicle): boolean => {
  return vehicle.isUsed || vehicle.is_used || false;
};

const getGroupId = (vehicle: Vehicle): string | undefined => {
  return vehicle.groupId || vehicle.group_id;
};

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  vehicleGroup,
  className,
  children,
  isSelected = false,
  onClick,
  showDetailedInfo = false
}) => {
  // Tratamento de segurança para caso o veículo seja undefined
  if (!vehicle) {
    return (
      <div className={cn(
        "border rounded-lg p-4 bg-muted/20 flex items-center justify-center",
        className
      )}>
        <p className="text-muted-foreground">Dados do veículo não disponíveis</p>
      </div>
    );
  }

  // Valores seguros
  const brand = vehicle.brand || 'Marca não especificada';
  const model = vehicle.model || 'Modelo não especificado';
  const year = vehicle.year || new Date().getFullYear();
  const plateNumber = getPlateNumber(vehicle);
  const isUsed = isVehicleUsed(vehicle);
  const group = vehicleGroup?.id || getGroupId(vehicle) || '?';
  
  return (
    <div 
      className={cn(
        "relative border rounded-lg p-4 hover:border-primary/50 transition-colors",
        onClick && "cursor-pointer",
        isSelected && "border-primary bg-primary/5",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
            <h3 className="font-medium">
              {brand} {model}
            </h3>
          </div>
          
          <div className="text-sm mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{year}</span>
              
              {plateNumber && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>{plateNumber}</span>
                </>
              )}
              
              {isUsed && (
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-xs">
                  Usado
                </span>
              )}
            </div>
            
            {group && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span>Grupo {group}</span>
                
                {vehicleGroup?.description && (
                  <span className="text-xs text-muted-foreground">
                    ({vehicleGroup.description})
                  </span>
                )}
              </div>
            )}
            
            {showDetailedInfo && (
              <>
                {vehicle.value && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Valor do veículo:</p>
                    <p className="font-medium">
                      R$ {Number(vehicle.value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                
                {vehicle.color && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground">Cor:</span>
                    <span>{vehicle.color}</span>
                  </div>
                )}
                
                {(vehicle.odometer !== undefined && vehicle.odometer > 0) && (
                  <div className="flex items-center gap-2 mt-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Odômetro:</span>
                    <span>{vehicle.odometer.toLocaleString('pt-BR')} km</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {vehicle.value && !children && (
          <div className="text-right">
            <p className="font-medium">
              R$ {Number(vehicle.value).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">Valor do veículo</p>
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default VehicleCard;
