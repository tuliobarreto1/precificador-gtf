
import React from 'react';
import { Car, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vehicle, VehicleGroup } from '@/lib/mock-data';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type VehicleCardProps = {
  vehicle: Vehicle | any; // Aceita tanto Vehicle quanto o formato do Supabase
  vehicleGroup?: VehicleGroup; // Adicionado como opcional
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

const VehicleCard = ({ 
  vehicle, 
  vehicleGroup,
  isSelected = false, 
  onClick, 
  className,
  children
}: VehicleCardProps) => {
  // Função auxiliar para extrair valores independente do formato do veículo
  const getBrand = () => vehicle.vehicleBrand || vehicle.brand || 'Não especificado';
  const getModel = () => vehicle.vehicleModel || vehicle.model || 'Não especificado';
  const getYear = () => vehicle.year || 'N/A';
  const getPlate = () => vehicle.plateNumber || vehicle.plate_number || null;
  const isUsed = () => vehicle.isUsed || vehicle.is_used || false;
  const getOdometer = () => vehicle.odometer || null;
  const getValue = () => {
    // Valores podem estar em diferentes propriedades dependendo da fonte
    if (vehicle.value !== undefined) return vehicle.value;
    if (vehicle.monthlyValue !== undefined) return vehicle.monthlyValue;
    if (vehicle.monthly_value !== undefined) return vehicle.monthly_value;
    return 0;
  };
  
  // Pegar informações de revisão e pneus
  const getRevisionKm = () => {
    if (vehicle.revisionKm) return vehicle.revisionKm;
    if (vehicleGroup?.revisionKm) return vehicleGroup.revisionKm;
    return null;
  };
  
  const getTireKm = () => {
    if (vehicle.tireKm) return vehicle.tireKm;
    if (vehicleGroup?.tireKm) return vehicleGroup.tireKm;
    return null;
  };
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border p-4 transition-all duration-200 relative",
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
            <h3 className="font-medium">{getBrand()} {getModel()}</h3>
            {isUsed() && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Usado
              </span>
            )}
            {getPlate() && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {getPlate()}
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {getYear()}
            {getOdometer() && ` • ${Number(getOdometer()).toLocaleString('pt-BR')} km`}
          </p>
        </div>
        
        <div className="text-right">
          <p className="font-medium">R$ {Number(getValue()).toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor do veículo</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <div className="flex flex-wrap gap-2 text-sm">
          {getRevisionKm() && (
            <div>
              <p className="text-muted-foreground">Revisão:</p>
              <p>A cada {getRevisionKm().toLocaleString('pt-BR')} km</p>
            </div>
          )}
          {getTireKm() && (
            <div>
              <p className="text-muted-foreground">Pneus:</p>
              <p>A cada {getTireKm().toLocaleString('pt-BR')} km</p>
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default VehicleCard;
