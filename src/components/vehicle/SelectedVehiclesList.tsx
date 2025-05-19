
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SelectedVehiclesListProps {
  vehicles: any[]; // Aceitando qualquer tipo de veículo que tenha as propriedades necessárias
  onRemove?: (vehicleId: string) => void;
}

const SelectedVehiclesList: React.FC<SelectedVehiclesListProps> = ({ vehicles, onRemove }) => {
  if (!vehicles || vehicles.length === 0) return null;

  return (
    <div className="border p-4 rounded-lg bg-primary/5">
      <h3 className="text-base font-medium mb-3">Veículos Selecionados ({vehicles.length})</h3>
      <div className="flex flex-wrap gap-2">
        {vehicles.map(vehicle => {
          // Verificar se o veículo é válido
          if (!vehicle) return null;
          
          // Extrair ID com verificação de segurança
          const id = vehicle.id || vehicle.vehicleId || '';
          
          // Extrair informações do modelo e marca com fallbacks
          const brand = vehicle.brand || vehicle.vehicleBrand || '';
          const model = vehicle.model || vehicle.vehicleModel || '';
          
          // Extrair placa com verificações de diferentes formatos
          const plateNumber = 
            vehicle.plateNumber || 
            vehicle.plate_number || 
            (vehicle.vehicle && vehicle.vehicle.plateNumber) || 
            (vehicle.vehicle && vehicle.vehicle.plate_number) || 
            '';

          return (
            <Badge 
              key={id} 
              variant="secondary"
              className="py-2 pl-3 pr-2 flex items-center gap-1"
            >
              <span>
                {brand} {model}
                {plateNumber && ` (${plateNumber})`}
              </span>
              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={() => onRemove(id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedVehiclesList;
