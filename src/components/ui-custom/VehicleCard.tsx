import React, { useState, useEffect } from 'react';
import { Car, Info, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProtectionDetails from '@/components/protection/ProtectionDetails';
import { useTaxIndices } from '@/hooks/useTaxIndices';

type VehicleCardProps = {
  vehicle: any;
  showDetailedInfo?: boolean;
  showCosts?: boolean;
  children?: React.ReactNode;
  onDelete?: () => void;
  disabled?: boolean;
};

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  showDetailedInfo = false,
  showCosts = false,
  children,
  onDelete,
  disabled = false
}) => {
  const { getTaxBreakdown } = useTaxIndices();
  
  // Adicionando log para depuração com mais detalhes
  console.log("VehicleCard - dados completos do veículo:", JSON.stringify(vehicle, null, 2));
  
  useEffect(() => {
    // Log para verificar os dados de impostos no carregamento com mais detalhes
    if (vehicle) {
      console.log("VehicleCard - dados detalhados de impostos:", {
        includeIpva: vehicle.include_ipva || vehicle.includeIpva,
        ipvaCost: vehicle.ipva_cost || vehicle.ipvaCost,
        includeLicensing: vehicle.include_licensing || vehicle.includeLicensing,
        licensingCost: vehicle.licensing_cost || vehicle.licensingCost,
        includeTaxes: vehicle.include_taxes || vehicle.includeTaxes,
        taxCost: vehicle.tax_cost || vehicle.taxCost,
        vehicleValue: vehicle.vehicle?.value || vehicle?.value,
        contractMonths: vehicle.contract_months || vehicle.contractMonths || 24,
        showCosts: showCosts
      });
    }
  }, [vehicle, showCosts]);
  
  // Se o veículo for nulo ou undefined, retornamos um card vazio
  if (!vehicle) {
    console.error('VehicleCard recebeu um vehicle nulo ou indefinido');
    return (
      <Card className="border-dashed border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground">Veículo não disponível</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  // Verificamos se temos um objeto vehicle dentro do vehicle (formatos diferentes podem ser recebidos)
  const vehicleObj = vehicle.vehicle || vehicle;
  
  // Se após essa verificação ainda não temos um objeto válido, retornamos um card de erro
  if (!vehicleObj) {
    console.error('VehicleCard: Dados de veículo inválidos', vehicle);
    return (
      <Card className="border-dashed border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground">Dados de veículo inválidos</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Agora extraímos as propriedades com segurança, sempre fornecendo valores padrão
  const brand = vehicleObj.brand || 'Marca não disponível';
  const model = vehicleObj.model || 'Modelo não disponível';
  const year = vehicleObj.year || new Date().getFullYear();
  const plateNumber = vehicleObj.plateNumber || vehicleObj.plate_number;
  const isUsed = vehicleObj.isUsed || vehicleObj.is_used || false;
  const value = vehicleObj.value || 0;
  
  // Valores de custo do veículo, verificando se existem no objeto original
  const depreciationCost = vehicle.depreciation_cost || vehicle.depreciationCost || 0;
  const maintenanceCost = vehicle.maintenance_cost || vehicle.maintenanceCost || 0;
  const protectionCost = vehicle.protection_cost || vehicle.protectionCost || 0;
  const totalCost = vehicle.total_cost || vehicle.totalCost || 0;
  
  // Valores de custo de impostos
  const ipvaCost = vehicle.ipva_cost || vehicle.ipvaCost || 0;
  const licensingCost = vehicle.licensing_cost || vehicle.licensingCost || 0;
  const taxCost = vehicle.tax_cost || vehicle.taxCost || 0;
  
  // Parâmetros para verificar se deve incluir impostos
  const includeIpva = vehicle.include_ipva || vehicle.includeIpva || false;
  const includeLicensing = vehicle.include_licensing || vehicle.includeLicensing || false;
  const includeTaxes = vehicle.include_taxes || vehicle.includeTaxes || false;
  
  // Plano de proteção
  const protectionPlanId = vehicle.protection_plan_id || vehicle.protectionPlanId || null;
  
  // Verificar se há impostos incluídos para mostrar a seção
  const hasTaxes = (includeIpva && ipvaCost > 0) || 
                 (includeLicensing && licensingCost > 0) || 
                 (includeTaxes && taxCost > 0);
  
  // Calcular total de impostos
  const totalTaxes = (includeIpva ? ipvaCost : 0) + 
                    (includeLicensing ? licensingCost : 0) + 
                    (includeTaxes ? taxCost : 0);
  
  // Obter breakdown dos impostos se aplicável
  const contractMonths = vehicle.contract_months || vehicle.contractMonths || 24;
  const taxBreakdown = includeTaxes && value && contractMonths ? getTaxBreakdown(value, contractMonths) : null;
  
  // Adicionar log de debug para o breakdown dos impostos
  if (includeTaxes && taxBreakdown) {
    console.log("VehicleCard - Tax breakdown calculado:", {
      vehicle: `${brand} ${model}`,
      value,
      contractMonths,
      taxBreakdown,
      hasTaxes,
      totalTaxes
    });
  }
  
  console.log("VehicleCard - Verificação final de valores:", {
    showCosts,
    hasTaxes,
    includeIpva,
    includeLicensing,
    includeTaxes,
    ipvaCost,
    licensingCost,
    taxCost,
    totalTaxes
  });
  
  return (
    <Card className={`${disabled ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle>{brand} {model}</CardTitle>
            <CardDescription>
              {year} • {isUsed ? 'Usado' : 'Novo'}
              {plateNumber && ` • Placa: ${plateNumber}`}
            </CardDescription>
          </div>
          {onDelete && (
            <button 
              onClick={onDelete}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
              disabled={disabled}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-muted-foreground"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor do veículo:</span>
            <span className="font-medium">R$ {value.toLocaleString('pt-BR')}</span>
          </div>
          
          {showCosts && (
            <div className="space-y-1 border-t pt-3 mt-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Depreciação:</span>
                <span>R$ {depreciationCost.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Manutenção:</span>
                <span>R$ {maintenanceCost.toLocaleString('pt-BR')}</span>
              </div>
              {protectionCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-green-600" />
                    Proteção:
                  </span>
                  <span>R$ {protectionCost.toLocaleString('pt-BR')}</span>
                </div>
              )}
              
              {/* Seção de Impostos e Taxas - Garantindo que apareça quando tiver impostos */}
              {showCosts && (
                <div className="border-t pt-2 mt-2">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="taxes" className="border-0">
                      <div className="flex justify-between items-center">
                        <AccordionTrigger className="py-1 text-sm text-primary font-medium hover:underline">
                          Impostos e taxas:
                        </AccordionTrigger>
                        <span className="text-sm">R$ {totalTaxes.toLocaleString('pt-BR')}</span>
                      </div>
                      
                      <AccordionContent className="py-2">
                        <div className="text-xs space-y-1 text-muted-foreground bg-slate-50 p-3 rounded-md">
                          {includeIpva && (
                            <div className="flex justify-between">
                              <span>IPVA:</span>
                              <span>R$ {ipvaCost.toLocaleString('pt-BR')}/mês</span>
                            </div>
                          )}
                          
                          {includeLicensing && (
                            <div className="flex justify-between">
                              <span>Licenciamento:</span>
                              <span>R$ {licensingCost.toLocaleString('pt-BR')}/mês</span>
                            </div>
                          )}
                          
                          {includeTaxes && (
                            <>
                              <div className="flex justify-between">
                                <span>Custos financeiros:</span>
                                <span>R$ {taxCost.toLocaleString('pt-BR')}/mês</span>
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
                                          <span>Taxa SELIC ({contractMonths >= 24 ? '24 meses' : contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
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
                                          <span>R$ {taxBreakdown.annualCost.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Custo mensal:</span>
                                          <span>R$ {taxBreakdown.monthlyCost.toLocaleString('pt-BR')}</span>
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
              
              <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
                <span>Total mensal:</span>
                <span>R$ {totalCost.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          )}
          
          {/* Exibir componente de detalhes da proteção se houver um plano de proteção */}
          {protectionPlanId && (
            <div className="border-t pt-3 mt-3">
              <ProtectionDetails planId={protectionPlanId} />
            </div>
          )}
          
          {showDetailedInfo && vehicleObj.group_id && (
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Grupo:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-help">
                        <span className="mr-1">Grupo {vehicleObj.group_id}</span>
                        <Info className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Os grupos definem categorias de veículos com diferentes<br />
                        custos de manutenção e características operacionais.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {vehicleObj.odometer !== undefined && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Odômetro:</span>
                  <span>{vehicleObj.odometer.toLocaleString('pt-BR')} km</span>
                </div>
              )}
              {vehicleObj.fuel_type && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Combustível:</span>
                  <span>{vehicleObj.fuel_type}</span>
                </div>
              )}
            </div>
          )}
          
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
