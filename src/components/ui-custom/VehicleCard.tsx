
import React from 'react';
import { Car, Info, Calendar, Wrench, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vehicle, VehicleGroup } from '@/lib/mock-data';

type VehicleCardProps = {
  vehicle: Vehicle | any; // Aceita tanto Vehicle quanto o formato do Supabase
  vehicleGroup?: VehicleGroup; // Propriedade do grupo de veículo
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  showDetailedInfo?: boolean;
};

const VehicleCard = ({ 
  vehicle, 
  vehicleGroup,
  isSelected = false, 
  onClick, 
  className,
  children,
  showDetailedInfo = false
}: VehicleCardProps) => {
  // Função auxiliar para extrair valores independente do formato do veículo
  const getBrand = () => vehicle.vehicleBrand || vehicle.brand || vehicle.vehicle?.brand || 'Não especificado';
  const getModel = () => vehicle.vehicleModel || vehicle.model || vehicle.vehicle?.model || 'Não especificado';
  const getYear = () => vehicle.year || vehicle.vehicle?.year || 'N/A';
  const getPlate = () => vehicle.plateNumber || vehicle.plate_number || vehicle.vehicle?.plate_number || null;
  const isUsed = () => vehicle.isUsed || vehicle.is_used || vehicle.vehicle?.is_used || false;
  const getOdometer = () => vehicle.odometer || vehicle.vehicle?.odometer || null;
  const getValue = () => {
    // Valores podem estar em diferentes propriedades dependendo da fonte
    if (vehicle.value !== undefined) return vehicle.value;
    if (vehicle.monthly_value !== undefined) return vehicle.monthly_value;
    if (vehicle.monthlyValue !== undefined) return vehicle.monthlyValue;
    if (vehicle.vehicle?.value !== undefined) return vehicle.vehicle.value;
    if (vehicle.totalCost !== undefined) return vehicle.totalCost;
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

  // Obter informações de depreciação e manutenção
  const getDepreciationCost = () => {
    if (vehicle.depreciationCost !== undefined) return vehicle.depreciationCost;
    if (vehicle.vehicle?.value !== undefined) return vehicle.vehicle.value * 0.7; // Estimativa
    return null;
  };

  const getMaintenanceCost = () => {
    if (vehicle.maintenanceCost !== undefined) return vehicle.maintenanceCost;
    return null;
  };

  // Calcular custo por km
  const getCostPerKm = () => {
    const totalValue = getValue();
    const monthlyKm = vehicle.monthly_km || vehicle.monthlyKm || 3000;
    const contractMonths = vehicle.contract_months || vehicle.contractMonths || 24;
    const totalKm = monthlyKm * contractMonths;
    
    if (totalValue && totalKm > 0) {
      return Number((totalValue / totalKm).toFixed(2));
    }
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
      
      {(getRevisionKm() || getTireKm() || showDetailedInfo) && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            {getRevisionKm() && (
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Revisão:</p>
                  <p>A cada {getRevisionKm().toLocaleString('pt-BR')} km</p>
                </div>
              </div>
            )}
            
            {getTireKm() && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Pneus:</p>
                  <p>A cada {getTireKm().toLocaleString('pt-BR')} km</p>
                </div>
              </div>
            )}

            {showDetailedInfo && (
              <>
                {getDepreciationCost() && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Depreciação:</p>
                      <p>R$ {Number(getDepreciationCost()).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                )}
                
                {getMaintenanceCost() && (
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Manutenção:</p>
                      <p>R$ {Number(getMaintenanceCost()).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                )}
                
                {getCostPerKm() && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Custo por KM:</p>
                      <p>R$ {getCostPerKm().toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default VehicleCard;
