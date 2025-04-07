import React, { useState } from 'react';
import { QuoteResultVehicle } from '@/context/types/quoteTypes';
import Card from '@/components/ui-custom/Card';
import { Vehicle } from '@/lib/models';
import { formatCurrency } from '@/lib/utils';
import { useTaxIndices } from '@/hooks/useTaxIndices';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface QuoteSummaryProps {
  vehicle: Vehicle;
  result: QuoteResultVehicle;
  showDetailedBreakdown?: boolean;
}

const QuoteSummary: React.FC<QuoteSummaryProps> = ({ vehicle, result, showDetailedBreakdown = false }) => {
  const { getTaxBreakdown } = useTaxIndices();
  const [taxDetailsOpen, setTaxDetailsOpen] = useState(false);
  
  // Calcular breakdown dos impostos se aplicável
  const taxBreakdown = result.includeTaxes && result.contractMonths 
    ? getTaxBreakdown(vehicle.value, result.contractMonths) 
    : null;
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">{vehicle.brand} {vehicle.model}</h3>
      <p className="text-sm text-muted-foreground mb-4">Valor do veículo: {formatCurrency(vehicle.value)}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Depreciação:</span>
          <span>{formatCurrency(result.depreciationCost)}/mês</span>
        </div>
        
        <div className="flex justify-between">
          <span>Manutenção:</span>
          <span>{formatCurrency(result.maintenanceCost)}/mês</span>
        </div>
        
        {result.protectionCost > 0 && (
          <div className="flex justify-between">
            <span>Proteção:</span>
            <span>{formatCurrency(result.protectionCost)}/mês</span>
          </div>
        )}
        
        {result.includeIpva && (
          <div className="flex justify-between">
            <span>IPVA:</span>
            <span>{formatCurrency(result.ipvaCost || 0)}/mês</span>
          </div>
        )}
        
        {result.includeLicensing && (
          <div className="flex justify-between">
            <span>Licenciamento:</span>
            <span>{formatCurrency(result.licensingCost || 0)}/mês</span>
          </div>
        )}
        
        {result.includeTaxes && (
          <Collapsible open={taxDetailsOpen} onOpenChange={setTaxDetailsOpen} className="border-t border-b py-2 my-2">
            <div className="flex justify-between items-center">
              <CollapsibleTrigger className="flex items-center text-primary font-medium hover:underline">
                <span>Custos financeiros:</span>
                {taxDetailsOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </CollapsibleTrigger>
              <span>{formatCurrency(result.taxCost || 0)}/mês</span>
            </div>
            
            <CollapsibleContent className="pt-2">
              {taxBreakdown && (
                <div className="text-xs space-y-1 text-muted-foreground bg-slate-50 p-2 rounded-md">
                  <div className="flex justify-between">
                    <span>Taxa SELIC ({result.contractMonths >= 24 ? '24 meses' : result.contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
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
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <div className="border-t pt-2 mt-2 font-medium flex justify-between">
          <span>Valor total:</span>
          <span>{formatCurrency(result.totalCost)}/mês</span>
        </div>
        
        <div className="text-sm flex justify-between">
          <span>Valor por km:</span>
          <span>R$ {((result.totalCost || 0) / (result.monthlyKm || 1000)).toFixed(2)}/km</span>
        </div>
        
        <div className="text-sm flex justify-between">
          <span>Valor km adicional:</span>
          <span>R$ {result.extraKmRate.toFixed(2)}/km</span>
        </div>
      </div>
      
      {showDetailedBreakdown && result.includeTaxes && taxBreakdown && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-2">Detalhamento dos custos financeiros</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Taxa SELIC ({result.contractMonths >= 24 ? '24 meses' : result.contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
              <span>{taxBreakdown.selicRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Spread:</span>
              <span>{taxBreakdown.spread.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Taxa total anual:</span>
              <span>{taxBreakdown.totalTaxRate.toFixed(2)}%</span>
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
        </div>
      )}
    </Card>
  );
};

export default QuoteSummary;