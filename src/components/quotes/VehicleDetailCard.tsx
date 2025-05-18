
import React, { useState } from 'react';
import { SavedVehicle } from '@/context/types/quoteTypes';
import Card from '@/components/ui-custom/Card';
import { formatCurrency } from '@/lib/utils';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTaxIndices } from '@/hooks/useTaxIndices';

interface VehicleDetailCardProps {
  vehicle: SavedVehicle;
  contractMonths: number;
}

const VehicleDetailCard: React.FC<VehicleDetailCardProps> = ({ vehicle, contractMonths }) => {
  const { getTaxBreakdown } = useTaxIndices();
  const [taxDetailsOpen, setTaxDetailsOpen] = useState(false);
  
  console.log("Dados do veículo no VehicleDetailCard:", vehicle);
  
  const showTaxDetails = vehicle.includeTaxes && vehicle.taxCost !== undefined && vehicle.taxCost > 0;
  
  const totalTaxes = (
    (vehicle.includeIpva && vehicle.ipvaCost ? vehicle.ipvaCost : 0) + 
    (vehicle.includeLicensing && vehicle.licensingCost ? vehicle.licensingCost : 0) + 
    (vehicle.includeTaxes && vehicle.taxCost ? vehicle.taxCost : 0)
  );
  
  let taxBreakdown = null;
  if (showTaxDetails && vehicle.vehicleValue && contractMonths) {
    taxBreakdown = getTaxBreakdown(vehicle.vehicleValue, contractMonths);
    console.log("Tax breakdown calculado:", taxBreakdown);
  }
  
  const hasTaxes = (vehicle.includeIpva && vehicle.ipvaCost && vehicle.ipvaCost > 0) || 
                  (vehicle.includeLicensing && vehicle.licensingCost && vehicle.licensingCost > 0) || 
                  (vehicle.includeTaxes && vehicle.taxCost && vehicle.taxCost > 0);
  
  console.log("Dados de impostos:", {
    includeIpva: vehicle.includeIpva,
    ipvaCost: vehicle.ipvaCost,
    includeLicensing: vehicle.includeLicensing,
    licensingCost: vehicle.licensingCost,
    includeTaxes: vehicle.includeTaxes,
    taxCost: vehicle.taxCost,
    hasTaxes: hasTaxes,
    totalTaxes: totalTaxes
  });
  
  return (
    <Card className="p-4">
      <h4 className="text-lg font-medium">{vehicle.vehicleBrand} {vehicle.vehicleModel}</h4>
      {vehicle.plateNumber && (
        <p className="text-sm mb-2">Placa: {vehicle.plateNumber}</p>
      )}
      
      {vehicle.vehicleValue && (
        <p className="text-sm text-muted-foreground">
          Valor do veículo: {formatCurrency(vehicle.vehicleValue)}
        </p>
      )}
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Valor mensal:</span>
          <span className="font-medium">{formatCurrency(vehicle.totalCost || 0)}</span>
        </div>
        
        {vehicle.monthlyKm && (
          <div className="flex justify-between text-sm">
            <span>Quilometragem:</span>
            <span>{vehicle.monthlyKm} km/mês</span>
          </div>
        )}
        
        {vehicle.contractMonths && (
          <div className="flex justify-between text-sm">
            <span>Prazo:</span>
            <span>{vehicle.contractMonths} meses</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Depreciação:</span>
          <span>{formatCurrency(vehicle.depreciationCost || 0)}/mês</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Manutenção:</span>
          <span>{formatCurrency(vehicle.maintenanceCost || 0)}/mês</span>
        </div>
        
        {vehicle.protectionCost !== undefined && vehicle.protectionCost > 0 && (
          <div className="flex justify-between text-sm">
            <span>Proteção:</span>
            <span>{formatCurrency(vehicle.protectionCost)}/mês</span>
          </div>
        )}
        
        {hasTaxes && (
          <Collapsible open={taxDetailsOpen} onOpenChange={setTaxDetailsOpen} className="border-t border-b py-2 my-2">
            <div className="flex justify-between items-center">
              <CollapsibleTrigger className="flex items-center text-primary font-medium hover:underline text-sm">
                <span>Impostos e taxas:</span>
                {taxDetailsOpen ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </CollapsibleTrigger>
              <span className="text-sm">{formatCurrency(totalTaxes)}/mês</span>
            </div>
            
            <CollapsibleContent className="pt-2">
              <div className="text-xs space-y-1 text-muted-foreground bg-slate-50 p-2 rounded-md">
                {vehicle.includeIpva && vehicle.ipvaCost && vehicle.ipvaCost > 0 && (
                  <div className="flex justify-between">
                    <span>IPVA:</span>
                    <span>{formatCurrency(vehicle.ipvaCost)}/mês</span>
                  </div>
                )}
                
                {vehicle.includeLicensing && vehicle.licensingCost && vehicle.licensingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Licenciamento:</span>
                    <span>{formatCurrency(vehicle.licensingCost)}/mês</span>
                  </div>
                )}
                
                {vehicle.includeTaxes && vehicle.taxCost && vehicle.taxCost > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Custos financeiros:</span>
                      <span>{formatCurrency(vehicle.taxCost)}/mês</span>
                    </div>
                    
                    {taxBreakdown && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between">
                          <span>Taxa SELIC ({contractMonths >= 24 ? '24 meses' : contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
                          <span>{taxBreakdown.selicRate.toFixed(2)}% a.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spread financeiro:</span>
                          <span>{taxBreakdown.spread.toFixed(2)}% a.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa total anual:</span>
                          <span>{taxBreakdown.totalTaxRate.toFixed(2)}% a.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo anual:</span>
                          <span>{formatCurrency(taxBreakdown.annualCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo mensal:</span>
                          <span>{formatCurrency(taxBreakdown.monthlyCost)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
      
      <div className="mt-4 pt-2 border-t flex justify-between">
        <span className="font-medium">Total:</span>
        <span className="font-bold">{formatCurrency(vehicle.totalCost || 0)}/mês</span>
      </div>
      
      {vehicle.protectionPlanId && (
        <div className="mt-3 pt-1">
          <div className="flex items-center text-sm">
            <Shield className="h-4 w-4 mr-1 text-green-600" />
            <span className="text-muted-foreground">Proteção incluída</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VehicleDetailCard;
