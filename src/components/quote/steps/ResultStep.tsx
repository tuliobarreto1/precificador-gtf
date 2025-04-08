
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Card from '@/components/ui-custom/Card';
import { QuoteCalculationResult, QuoteFormData } from '@/context/types/quoteTypes';
import { formatCurrency } from '@/lib/utils';
import ProtectionDetails from '@/components/protection/ProtectionDetails';
import { useTaxIndices } from '@/hooks/useTaxIndices';
import { EmailDialog } from '../EmailDialog';
import RoicSlider from '../RoicSlider';

interface ResultStepProps {
  quoteForm: QuoteFormData | null;
  result: QuoteCalculationResult | null;
  isEditMode: boolean;
  currentEditingQuoteId: string | null;
  goToPreviousStep: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({ 
  quoteForm, 
  result, 
  isEditMode, 
  currentEditingQuoteId, 
  goToPreviousStep 
}) => {
  const { getTaxBreakdown } = useTaxIndices();
  const [adjustedVehicleCosts, setAdjustedVehicleCosts] = useState<{[key: string]: number}>({});
  const [currentRoic, setCurrentRoic] = useState<number | null>(null);
  
  console.log("ResultStep - quoteForm:", quoteForm);
  console.log("ResultStep - result:", result);
  
  if (!result) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </span>
        </div>
        <h3 className="text-lg font-medium mb-2">Não foi possível calcular o orçamento</h3>
        <p className="text-muted-foreground mb-6">
          Verifique se todos os dados estão preenchidos corretamente e se há pelo menos um veículo adicionado.
        </p>
        <button type="button" className="px-4 py-2 border rounded hover:bg-slate-50" onClick={goToPreviousStep}>
          Voltar para parâmetros
        </button>
      </div>
    );
  }
  
  const { vehicleResults } = result;
  
  // Calcular o total ajustado com base nos custos ajustados dos veículos
  const getAdjustedTotal = () => {
    return vehicleResults.reduce((total, vehicleResult) => {
      const vehicleId = vehicleResult.vehicleId;
      // Se há um custo ajustado para este veículo, use-o, caso contrário use o custo original
      const cost = adjustedVehicleCosts[vehicleId] !== undefined ? 
        adjustedVehicleCosts[vehicleId] : vehicleResult.totalCost;
      return total + cost;
    }, 0);
  };
  
  // Determinar qual valor total mostrar (o original ou o ajustado)
  const displayTotalCost = getAdjustedTotal();
  
  // Handler para quando o ROIC é ajustado para um veículo específico
  const handleVehicleRoicChange = (vehicleId: string, roicPercentage: number, adjustedCost: number) => {
    setAdjustedVehicleCosts(prev => ({
      ...prev,
      [vehicleId]: adjustedCost
    }));
    setCurrentRoic(roicPercentage);
  };
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">{`Resumo do Orçamento - ${quoteForm?.vehicles?.length || 0} veículo(s)`}</h3>
        </div>
        
        <div className="space-y-6 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{quoteForm?.client?.name || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="font-medium">{quoteForm?.globalParams?.contractMonths || 24} meses</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Quilometragem</p>
              <p className="font-medium">{(quoteForm?.globalParams?.monthlyKm || 3000).toLocaleString('pt-BR')} km/mês</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Severidade</p>
              <p className="font-medium">Nível {quoteForm?.globalParams?.operationSeverity || 3}</p>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Veículos Cotados</h3>
            <div className="space-y-4">
              {vehicleResults.map((result, index) => {
                if (!quoteForm?.vehicles) return null;
                
                const vehicleItem = quoteForm.vehicles.find(v => v.vehicle.id === result.vehicleId);
                if (!vehicleItem) return null;
                
                const params = quoteForm.useGlobalParams 
                  ? quoteForm.globalParams 
                  : (vehicleItem.params || quoteForm.globalParams || {
                    contractMonths: 24,
                    monthlyKm: 3000,
                    operationSeverity: 3 as 1|2|3|4|5|6,
                    hasTracking: false,
                    protectionPlanId: null,
                    includeIpva: false,
                    includeLicensing: false,
                    includeTaxes: false,
                  });
                
                const hasTaxes = (result.includeTaxes && result.taxCost > 0) || 
                               (result.includeIpva && result.ipvaCost > 0) || 
                               (result.includeLicensing && result.licensingCost > 0);
                
                const totalTaxes = (result.taxCost || 0) + (result.ipvaCost || 0) + (result.licensingCost || 0);
                
                const taxBreakdown = result.includeTaxes && result.contractMonths 
                  ? getTaxBreakdown(vehicleItem.vehicle.value, result.contractMonths) 
                  : null;
                
                // Verificar se há um custo ajustado para este veículo
                const vehicleDisplayCost = adjustedVehicleCosts[vehicleItem.vehicle.id] !== undefined ? 
                  adjustedVehicleCosts[vehicleItem.vehicle.id] : result.totalCost;
                
                console.log(`Dados de impostos para veículo ${vehicleItem.vehicle.brand} ${vehicleItem.vehicle.model}:`, {
                  includeTaxes: result.includeTaxes,
                  taxCost: result.taxCost,
                  includeIpva: result.includeIpva,
                  ipvaCost: result.ipvaCost,
                  includeLicensing: result.includeLicensing,
                  licensingCost: result.licensingCost,
                  hasTaxes: hasTaxes,
                  totalTaxes: totalTaxes,
                  taxBreakdown: taxBreakdown
                });
                
                return (
                  <div key={vehicleItem.vehicle.id} className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{vehicleItem.vehicle.brand} {vehicleItem.vehicle.model}</h4>
                        <p className="text-sm text-muted-foreground">
                          {vehicleItem.vehicle.plateNumber ? `Placa: ${vehicleItem.vehicle.plateNumber} • ` : ''}
                          Grupo: {vehicleItem.vehicleGroup.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(vehicleDisplayCost)}</p>
                        <p className="text-xs text-muted-foreground">Valor mensal</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Depreciação:</p>
                        <p className="font-medium">{formatCurrency(result.depreciationCost)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Manutenção:</p>
                        <p className="font-medium">{formatCurrency(result.maintenanceCost)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Km excedente:</p>
                        <p className="font-medium">R$ {result.extraKmRate.toFixed(2)}</p>
                      </div>
                      {result.protectionCost > 0 && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Proteção:</p>
                          <p className="font-medium">{formatCurrency(result.protectionCost)}</p>
                        </div>
                      )}
                    </div>

                    {hasTaxes && (
                      <div className="mt-3 pt-3 border-t">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="taxes" className="border-0">
                            <div className="flex justify-between items-center">
                              <AccordionTrigger className="py-1 text-sm text-primary font-medium hover:underline">
                                Impostos e taxas:
                              </AccordionTrigger>
                              <span className="text-sm font-medium">{formatCurrency(totalTaxes)}/mês</span>
                            </div>
                            
                            <AccordionContent className="py-2">
                              <div className="text-sm space-y-2 text-muted-foreground bg-slate-50 p-3 rounded-md">
                                {result.includeIpva && result.ipvaCost && result.ipvaCost > 0 && (
                                  <div className="flex justify-between">
                                    <span>IPVA:</span>
                                    <span>{formatCurrency(result.ipvaCost)}/mês</span>
                                  </div>
                                )}
                                
                                {result.includeLicensing && result.licensingCost && result.licensingCost > 0 && (
                                  <div className="flex justify-between">
                                    <span>Licenciamento:</span>
                                    <span>{formatCurrency(result.licensingCost)}/mês</span>
                                  </div>
                                )}
                                
                                {result.includeTaxes && result.taxCost && result.taxCost > 0 && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Custos financeiros:</span>
                                      <span>{formatCurrency(result.taxCost)}/mês</span>
                                    </div>
                                    
                                    {taxBreakdown && (
                                      <Accordion type="single" collapsible className="mt-2">
                                        <AccordionItem value="finance-details" className="border-0">
                                          <AccordionTrigger className="text-xs text-primary hover:underline py-1">
                                            Detalhamento dos custos financeiros
                                          </AccordionTrigger>
                                          
                                          <AccordionContent className="pt-2">
                                            <div className="space-y-2 text-xs pl-2 border-l-2 border-slate-200 mt-1">
                                              <div className="flex justify-between">
                                                <span>Taxa SELIC ({result.contractMonths >= 24 ? '24 meses' : result.contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
                                                <span>{taxBreakdown.selicRate.toFixed(2)}% a.a.</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Spread financeiro:</span>
                                                <span>{taxBreakdown.spread.toFixed(2)}% a.a.</span>
                                              </div>
                                              <div className="flex justify-between font-medium">
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
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    )}
                                  </>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                    
                    {result.protectionPlanId && (
                      <div className="mt-3 pt-3 border-t">
                        <ProtectionDetails planId={result.protectionPlanId} />
                      </div>
                    )}
                    
                    {!quoteForm.useGlobalParams && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Prazo:</p>
                          <p>{params.contractMonths} meses</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quilometragem:</p>
                          <p>{params.monthlyKm.toLocaleString('pt-BR')} km/mês</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Severidade:</p>
                          <p>Nível {params.operationSeverity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rastreamento:</p>
                          <p>{params.hasTracking ? 'Sim' : 'Não'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">IPVA:</p>
                          <p>{params.includeIpva ? 'Sim' : 'Não'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Licenciamento:</p>
                          <p>{params.includeLicensing ? 'Sim' : 'Não'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Custos Financeiros:</p>
                          <p>{params.includeTaxes ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Slider ROIC para o veículo específico */}
                    <div className="mt-4 pt-3 border-t">
                      <RoicSlider 
                        totalCost={result.totalCost} 
                        vehicleValues={[vehicleItem.vehicle.value]} 
                        onRoicChange={(roic, adjusted) => handleVehicleRoicChange(vehicleItem.vehicle.id, roic, adjusted)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex flex-col md:flex-row justify-between items-center p-6">
          <div>
            <h3 className="text-2xl font-semibold">Valor Total Mensal</h3>
            <p className="text-muted-foreground">
              {currentRoic ? `ROIC: ${currentRoic.toFixed(2)}% a.m.` : 'Todos os impostos inclusos'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(displayTotalCost)}
            </p>
            <p className="text-sm text-muted-foreground">
              {quoteForm?.vehicles?.length || 0} veículo(s)
            </p>
          </div>
        </div>
        
        {isEditMode && currentEditingQuoteId && (
          <div className="border-t p-4 flex justify-end">
            <EmailDialog quoteId={currentEditingQuoteId} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResultStep;
