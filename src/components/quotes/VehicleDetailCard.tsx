
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { SavedQuoteVehicle } from '@/context/types/quoteTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VehicleDetailCardProps {
  vehicle: SavedQuoteVehicle;
  contractMonths: number;
}

const VehicleDetailCard: React.FC<VehicleDetailCardProps> = ({ vehicle, contractMonths }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {vehicle.vehicleBrand} {vehicle.vehicleModel}
        </CardTitle>
        {vehicle.plateNumber && (
          <p className="text-sm text-muted-foreground">
            Placa: {vehicle.plateNumber}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Valor Mensal:</span>
          <span className="font-medium">{formatCurrency(vehicle.totalCost)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total do Contrato:</span>
          <span className="font-medium">{formatCurrency(vehicle.totalCost * contractMonths)}</span>
        </div>
        
        {vehicle.ipvaCost && vehicle.ipvaCost > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">IPVA/mês:</span>
            <span>{formatCurrency(vehicle.ipvaCost)}</span>
          </div>
        )}
        
        {vehicle.licensingCost && vehicle.licensingCost > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Licenciamento/mês:</span>
            <span>{formatCurrency(vehicle.licensingCost)}</span>
          </div>
        )}
        
        {vehicle.taxCost && vehicle.taxCost > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Custos Financeiros/mês:</span>
            <span>{formatCurrency(vehicle.taxCost)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleDetailCard;
