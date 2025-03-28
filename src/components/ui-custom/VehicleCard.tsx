
import React from 'react';
import { Car, Info, Calendar, Wrench, Gauge, DollarSign, TrendingDown } from 'lucide-react';
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
    if (vehicle.vehicle?.revisionKm) return vehicle.vehicle.revisionKm;
    if (vehicleGroup?.revisionKm) return vehicleGroup.revisionKm;
    return 20000; // Valor padrão estimado
  };
  
  const getTireKm = () => {
    if (vehicle.tireKm) return vehicle.tireKm;
    if (vehicle.vehicle?.tireKm) return vehicle.vehicle.tireKm;
    if (vehicleGroup?.tireKm) return vehicleGroup.tireKm;
    return 40000; // Valor padrão estimado
  };

  // Obter informações de depreciação e manutenção
  const getDepreciationCost = () => {
    if (vehicle.depreciationCost !== undefined) return vehicle.depreciationCost;
    if (vehicle.vehicle?.depreciationCost !== undefined) return vehicle.vehicle.depreciationCost;
    
    // Cálculo estimado se não houver valor definido
    const originalValue = vehicle.vehicle?.value || vehicle.value || 0;
    return originalValue * 0.3; // Estima 30% de depreciação
  };

  const getMaintenanceCost = () => {
    if (vehicle.maintenanceCost !== undefined) return vehicle.maintenanceCost;
    if (vehicle.vehicle?.maintenanceCost !== undefined) return vehicle.vehicle.maintenanceCost;
    
    // Estimativa de custo de manutenção baseado no valor do veículo
    const vehicleValue = vehicle.vehicle?.value || vehicle.value || 0;
    return vehicleValue * 0.05; // Estima 5% do valor como custo anual de manutenção
  };

  // Calcular custo por km
  const getCostPerKm = () => {
    const totalValue = getValue();
    
    // Tenta obter valores específicos, ou usa valores padrão
    const monthlyKm = vehicle.monthly_km || 3000;
    const contractMonths = vehicle.contract_months || 24;
    const totalKm = monthlyKm * contractMonths;
    
    if (totalValue && totalKm > 0) {
      return Number((totalValue / totalKm).toFixed(2));
    }
    return 0.50; // Valor padrão estimado de R$0,50 por km
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {getRevisionKm() && (
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Revisão:</p>
                  <p className="text-sm">A cada {getRevisionKm().toLocaleString('pt-BR')} km</p>
                </div>
              </div>
            )}
            
            {getTireKm() && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Pneus:</p>
                  <p className="text-sm">A cada {getTireKm().toLocaleString('pt-BR')} km</p>
                </div>
              </div>
            )}

            {showDetailedInfo && (
              <>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Depreciação:</p>
                    <p className="text-sm">R$ {Number(getDepreciationCost()).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Manutenção:</p>
                    <p className="text-sm">R$ {Number(getMaintenanceCost()).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Custo por KM:</p>
                    <p className="text-sm">R$ {getCostPerKm().toFixed(2)}</p>
                  </div>
                </div>
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
