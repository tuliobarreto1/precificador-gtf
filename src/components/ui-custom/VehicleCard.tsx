
import React from 'react';
import { cn } from '@/lib/utils';
import { Car, Calendar, Gauge, Tag, DollarSign, Droplet } from 'lucide-react';

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
  fuelType?: string;
  fuel_type?: string; // Formato do Supabase
  groupId?: string;
  group_id?: string; // Formato do Supabase
}

interface VehicleGroup {
  id: string;
  name?: string;
  description?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle | any; // Permitir que vehicle seja do formato do Supabase também
  vehicleGroup?: VehicleGroup;
  className?: string;
  children?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  showDetailedInfo?: boolean;
  showCosts?: boolean; // Nova propriedade para exibir informações de custos
}

const getPlateNumber = (vehicle: any): string | undefined => {
  // Verificar primeiro se o veículo é um objeto aninhado (caso de quote_vehicles)
  if (vehicle.vehicle) {
    return vehicle.vehicle.plateNumber || vehicle.vehicle.plate_number;
  }
  
  // Caso contrário, verificar no próprio objeto
  return vehicle.plateNumber || vehicle.plate_number;
};

const getBrand = (vehicle: any): string => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.brand || 'Marca não especificada';
  }
  return vehicle.brand || 'Marca não especificada';
};

const getModel = (vehicle: any): string => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.model || 'Modelo não especificado';
  }
  return vehicle.model || 'Modelo não especificado';
};

const getYear = (vehicle: any): number => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.year || new Date().getFullYear();
  }
  return vehicle.year || new Date().getFullYear();
};

const getColor = (vehicle: any): string | undefined => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.color;
  }
  return vehicle.color;
};

const getValue = (vehicle: any): number | undefined => {
  // Verificar se há um valor mensal diretamente no objeto (caso quote_vehicles)
  if (vehicle.monthly_value !== undefined) {
    return vehicle.monthly_value;
  }
  
  // Verificar se há um valor no veículo aninhado
  if (vehicle.vehicle) {
    return vehicle.vehicle.value;
  }
  
  // Por fim, verificar no próprio objeto
  return vehicle.value;
};

const getOdometer = (vehicle: any): number | undefined => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.odometer;
  }
  return vehicle.odometer;
};

const getFuelType = (vehicle: any): string | undefined => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.fuelType || vehicle.vehicle.fuel_type;
  }
  return vehicle.fuelType || vehicle.fuel_type || vehicle.tipoCombustivel;
};

const getIsUsed = (vehicle: any): boolean => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.isUsed || vehicle.vehicle.is_used || false;
  }
  return vehicle.isUsed || vehicle.is_used || false;
};

const getGroupId = (vehicle: any): string | undefined => {
  if (vehicle.vehicle) {
    return vehicle.vehicle.groupId || vehicle.vehicle.group_id;
  }
  return vehicle.groupId || vehicle.group_id;
};

const getVehicleCosts = (vehicle: any) => {
  // Se o veículo já tem resultados de cálculo
  if (vehicle.result) {
    return {
      depreciationCost: vehicle.result.depreciationCost || 0,
      maintenanceCost: vehicle.result.maintenanceCost || 0,
      extraKmRate: vehicle.result.extraKmRate || 0,
      totalCost: vehicle.result.totalCost || 0
    };
  }
  
  // Se os custos estão no formato do Supabase
  if (vehicle.depreciation_cost !== undefined || 
      vehicle.maintenance_cost !== undefined || 
      vehicle.total_cost !== undefined) {
    return {
      depreciationCost: vehicle.depreciation_cost || 0,
      maintenanceCost: vehicle.maintenance_cost || 0,
      extraKmRate: vehicle.extra_km_rate || 0,
      totalCost: vehicle.total_cost || vehicle.monthly_value || 0
    };
  }
  
  // Se não houver informações de custo disponíveis
  return {
    depreciationCost: 0,
    maintenanceCost: 0,
    extraKmRate: 0,
    totalCost: getValue(vehicle) || 0
  };
};

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  vehicleGroup,
  className,
  children,
  isSelected = false,
  onClick,
  showDetailedInfo = false,
  showCosts = false
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

  console.log("Renderizando VehicleCard com dados:", vehicle);

  // Valores seguros
  const brand = getBrand(vehicle);
  const model = getModel(vehicle);
  const year = getYear(vehicle);
  const plateNumber = getPlateNumber(vehicle);
  const isUsed = getIsUsed(vehicle);
  const group = vehicleGroup?.id || getGroupId(vehicle) || '?';
  const color = getColor(vehicle);
  const value = getValue(vehicle);
  const odometer = getOdometer(vehicle);
  const fuelType = getFuelType(vehicle);
  
  // Informações de custo (se disponíveis)
  const costs = getVehicleCosts(vehicle);
  
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
                {value !== undefined && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Valor do veículo:</p>
                    <p className="font-medium">
                      R$ {Number(value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                
                {color && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground">Cor:</span>
                    <span>{color}</span>
                  </div>
                )}
                
                {fuelType && (
                  <div className="flex items-center gap-2 mt-1">
                    <Droplet className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Combustível:</span>
                    <span>{fuelType}</span>
                  </div>
                )}
                
                {(odometer !== undefined && odometer > 0) && (
                  <div className="flex items-center gap-2 mt-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Odômetro:</span>
                    <span>{odometer.toLocaleString('pt-BR')} km</span>
                  </div>
                )}
              </>
            )}
            
            {showCosts && (
              <div className="mt-3 pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Depreciação:</p>
                  <p>R$ {costs.depreciationCost.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Manutenção:</p>
                  <p>R$ {costs.maintenanceCost.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Km excedente:</p>
                  <p>R$ {costs.extraKmRate.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</p>
                </div>
                <div className="font-medium">
                  <p className="text-xs text-muted-foreground">Custo total:</p>
                  <p>R$ {costs.totalCost.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {value !== undefined && !children && !showCosts && (
          <div className="text-right">
            <p className="font-medium">
              R$ {Number(value).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">Valor do veículo</p>
          </div>
        )}
        
        {costs.totalCost > 0 && !children && showCosts && (
          <div className="text-right">
            <p className="font-medium">
              R$ {costs.totalCost.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">Valor mensal</p>
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default VehicleCard;
