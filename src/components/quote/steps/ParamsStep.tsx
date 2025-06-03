import React, { useState, useEffect } from 'react';
import { Info, Car, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProtectionPlanSelector from '@/components/protection/ProtectionPlanSelector';
import { QuoteFormData } from '@/context/types/quoteTypes';
import { VehicleParams } from '@/context/types/quoteTypes';

const KM_OPTIONS = [1000, 2000, 3000, 4000, 5000];

// Descrições dos níveis de severidade de operação
const SEVERITY_DESCRIPTIONS = {
  1: "Uso muito leve: Rodagem urbana em vias bem pavimentadas, pouca quilometragem, motorista único e cuidadoso.",
  2: "Uso leve: Rodagem principalmente urbana, com manutenção preventiva regular e poucos motoristas.",
  3: "Uso normal: Combinação de rodagem urbana e rodovias em bom estado, manutenção regular.",
  4: "Uso moderado: Maior quilometragem, uso frequente em estradas com condições variadas.",
  5: "Uso severo: Alta quilometragem, múltiplos motoristas, uso em estradas com condições ruins.",
  6: "Uso muito severo: Condições extremas de rodagem, estradas não pavimentadas, ambiente agressivo."
};

interface ParamsStepProps {
  quoteForm: QuoteFormData;
  setUseGlobalParams: (useGlobal: boolean) => void;
  setGlobalContractMonths: (months: number) => void;
  setGlobalMonthlyKm: (km: number) => void;
  setGlobalOperationSeverity: (severity: 1|2|3|4|5|6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setGlobalProtectionPlanId: (planId: string | null) => void;
  setGlobalIncludeIpva: (include: boolean) => void;
  setGlobalIncludeLicensing: (include: boolean) => void;
  setGlobalIncludeTaxes: (include: boolean) => void;
  setVehicleParams: (vehicleId: string, params: Partial<VehicleParams>) => void;
}

const ParamsStep: React.FC<ParamsStepProps> = ({
  quoteForm,
  setUseGlobalParams,
  setGlobalContractMonths,
  setGlobalMonthlyKm,
  setGlobalOperationSeverity,
  setGlobalHasTracking,
  setGlobalProtectionPlanId,
  setGlobalIncludeIpva,
  setGlobalIncludeLicensing,
  setGlobalIncludeTaxes,
  setVehicleParams
}) => {
  const [selectedVehicleTab, setSelectedVehicleTab] = useState<string | null | undefined>(undefined);
  const [showSeverityInfo, setShowSeverityInfo] = useState(false);

  useEffect(() => {
    if (quoteForm?.vehicles && quoteForm.vehicles.length > 0) {
      if (!selectedVehicleTab) {
        setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
      } else {
        const vehicleStillExists = quoteForm.vehicles.some(v => v.vehicle.id === selectedVehicleTab);
        if (!vehicleStillExists && quoteForm.vehicles.length > 0) {
          setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
        }
      }
    }
  }, [quoteForm?.vehicles, selectedVehicleTab]);

  // Componente para exibir tooltip com descrição da severidade
  const SeverityTooltip = ({ level }: { level: 1|2|3|4|5|6 }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 inline-block ml-1 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px] p-3">
          <p className="text-sm">{SEVERITY_DESCRIPTIONS[level]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderVehicleParams = (vehicleId: string) => {
    if (!quoteForm?.vehicles) return null;
    
    const vehicleItem = quoteForm.vehicles.find(v => v.vehicle.id === vehicleId);
    if (!vehicleItem) return null;
    
    const params = vehicleItem.params || (quoteForm.globalParams || {
      contractMonths: 24,
      monthlyKm: 3000,
      operationSeverity: 3 as 1|2|3|4|5|6,
      hasTracking: false,
      protectionPlanId: null,
      includeIpva: false,
      includeLicensing: false,
      includeTaxes: false,
    });
    
    return (
      <div className="space-y-6 p-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">{vehicleItem.vehicle.brand} {vehicleItem.vehicle.model}</h3>
          {vehicleItem.vehicle.plateNumber && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {vehicleItem.vehicle.plateNumber}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm">Prazo do Contrato</Label>
          <div className="space-y-3">
            <Slider
              value={[params.contractMonths]}
              min={6}
              max={24}
              step={1}
              onValueChange={(value) => setVehicleParams(vehicleId, { 
                contractMonths: value[0],
                monthlyKm: params.monthlyKm,
                operationSeverity: params.operationSeverity,
                hasTracking: params.hasTracking,
                protectionPlanId: params.protectionPlanId,
                includeIpva: params.includeIpva,
                includeLicensing: params.includeLicensing,
                includeTaxes: params.includeTaxes
              })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6 meses</span>
              <span>{params.contractMonths} meses</span>
              <span>24 meses</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm">Quilometragem Mensal</Label>
          <div className="grid grid-cols-5 gap-2">
            {KM_OPTIONS.map((km) => (
              <Button 
                key={`${vehicleId}-km-${km}`}
                type="button"
                variant={params.monthlyKm === km ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setVehicleParams(vehicleId, { 
                  contractMonths: params.contractMonths,
                  monthlyKm: km,
                  operationSeverity: params.operationSeverity,
                  hasTracking: params.hasTracking,
                  protectionPlanId: params.protectionPlanId,
                  includeIpva: params.includeIpva,
                  includeLicensing: params.includeLicensing,
                  includeTaxes: params.includeTaxes
                })}
              >
                {km.toLocaleString('pt-BR')} km
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Label className="text-sm">Severidade de Operação</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-6 w-6 p-0" 
              onClick={() => setShowSeverityInfo(!showSeverityInfo)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          
          {showSeverityInfo && (
            <div className="bg-muted/50 p-3 rounded-md mb-3 text-sm space-y-1">
              {Object.entries(SEVERITY_DESCRIPTIONS).map(([level, desc]) => (
                <p key={`severity-desc-${level}`} className="flex">
                  <span className="font-medium mr-2">Nível {level}:</span>
                  <span className="text-muted-foreground">{desc}</span>
                </p>
              ))}
            </div>
          )}
          
          <RadioGroup 
            value={params.operationSeverity.toString()} 
            onValueChange={(value) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: parseInt(value) as 1|2|3|4|5|6,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
            className="grid grid-cols-3 gap-2"
          >
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <RadioGroupItem value={level.toString()} id={`severity-${vehicleId}-${level}`} />
                <div className="flex items-center">
                  <Label htmlFor={`severity-${vehicleId}-${level}`} className="text-xs cursor-pointer">
                    Nível {level}
                  </Label>
                  <SeverityTooltip level={level as 1|2|3|4|5|6} />
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`tracking-${vehicleId}`} 
            checked={params.hasTracking}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: checked,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
          />
          <Label htmlFor={`tracking-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir rastreamento
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`ipva-${vehicleId}`} 
            checked={params.includeIpva || false}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: checked,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
          />
          <Label htmlFor={`ipva-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir IPVA ({((vehicleItem.vehicleGroup.ipvaCost || 0) * 100).toFixed(2)}% do valor do veículo)
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`licensing-${vehicleId}`} 
            checked={params.includeLicensing || false}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: checked,
              includeTaxes: params.includeTaxes
            })}
          />
          <Label htmlFor={`licensing-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir Licenciamento
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`taxes-${vehicleId}`} 
            checked={params.includeTaxes || false}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: checked
            })}
          />
          <Label htmlFor={`taxes-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir Custos Financeiros
          </Label>
        </div>
        
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm">Plano de Proteção</Label>
          <ProtectionPlanSelector
            selectedPlanId={params.protectionPlanId || null}
            onChange={(planId) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: planId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
          />
        </div>
      </div>
    );
  };

  if (!quoteForm) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-red-500">
          Erro ao carregar os dados do formulário.
        </div>
        <Button onClick={() => {}}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-primary/5 border p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">Parâmetros da Cotação</h3>
          <div className="flex items-center space-x-2">
            <Switch 
              id="global-params"
              checked={quoteForm.useGlobalParams}
              onCheckedChange={setUseGlobalParams}
            />
            <Label htmlFor="global-params">Usar parâmetros globais</Label>
          </div>
        </div>
        
        {quoteForm.useGlobalParams ? (
          <p className="text-sm text-muted-foreground">
            Os mesmos parâmetros serão aplicados a todos os veículos desta cotação.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cada veículo terá seus próprios parâmetros configuráveis.
          </p>
        )}
      </div>

      {quoteForm.useGlobalParams ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base">Prazo do Contrato</Label>
            <div className="space-y-3">
              <Slider
                value={[quoteForm.globalParams?.contractMonths || 24]}
                min={6}
                max={24}
                step={1}
                onValueChange={(value) => setGlobalContractMonths(value[0])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>6 meses</span>
                <span>{quoteForm.globalParams?.contractMonths || 24} meses</span>
                <span>24 meses</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base mb-2 block">Quilometragem Mensal</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {KM_OPTIONS.map((km) => (
                <Button 
                  key={`global-km-${km}`}
                  type="button"
                  variant={(quoteForm.globalParams?.monthlyKm || 3000) === km ? "default" : "outline"}
                  onClick={() => setGlobalMonthlyKm(km)}
                  className="w-full"
                >
                  {km.toLocaleString('pt-BR')} km
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Label className="text-base">Severidade de Operação</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-6 w-6 p-0" 
                onClick={() => setShowSeverityInfo(!showSeverityInfo)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            
            {showSeverityInfo && (
              <div className="bg-muted/50 p-4 rounded-md mb-3 text-sm space-y-2 border">
                <h4 className="font-medium mb-2">Níveis de Severidade em Locação de Veículos</h4>
                {Object.entries(SEVERITY_DESCRIPTIONS).map(([level, desc]) => (
                  <p key={`severity-desc-${level}`}>
                    <span className="font-medium mr-1">Nível {level}:</span> {desc}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground mt-2">
                  Quanto maior o nível de severidade, maior será o desgaste do veículo e, consequentemente, mais alto o custo de manutenção.
                </p>
              </div>
            )}
            
            <RadioGroup 
              value={String(quoteForm.globalParams?.operationSeverity || 3)} 
              onValueChange={(value) => setGlobalOperationSeverity(parseInt(value) as 1|2|3|4|5|6)}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <RadioGroupItem value={level.toString()} id={`severity-${level}`} />
                  <div className="flex items-center">
                    <Label htmlFor={`severity-${level}`} className="cursor-pointer">
                      Nível {level}
                    </Label>
                    <SeverityTooltip level={level as 1|2|3|4|5|6} />
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Switch 
              id="tracking" 
              checked={quoteForm.globalParams?.hasTracking || false}
              onCheckedChange={setGlobalHasTracking}
            />
            <Label htmlFor="tracking" className="cursor-pointer">Incluir rastreamento</Label>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Switch 
              id="ipva" 
              checked={quoteForm.globalParams?.includeIpva || false}
              onCheckedChange={setGlobalIncludeIpva}
            />
            <Label htmlFor="ipva" className="cursor-pointer">Incluir IPVA</Label>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Switch 
              id="licensing" 
              checked={quoteForm.globalParams?.includeLicensing || false}
              onCheckedChange={setGlobalIncludeLicensing}
            />
            <Label htmlFor="licensing" className="cursor-pointer">Incluir Licenciamento</Label>
          </div>
          
          <div className="flex items-center space-x-2 mb-6">
            <Switch 
              id="taxes" 
              checked={quoteForm.globalParams?.includeTaxes || false}
              onCheckedChange={setGlobalIncludeTaxes}
            />
            <Label htmlFor="taxes" className="cursor-pointer">Incluir Custos Financeiros</Label>
          </div>
          
          <div className="pt-6 border-t space-y-3">
            <Label className="text-base">Plano de Proteção</Label>
            <ProtectionPlanSelector
              selectedPlanId={quoteForm.globalParams?.protectionPlanId || null}
              onChange={setGlobalProtectionPlanId}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-medium">Parâmetros por Veículo</h3>
          {quoteForm.vehicles && quoteForm.vehicles.length > 0 && (
            <Tabs 
              value={selectedVehicleTab || quoteForm.vehicles[0].vehicle.id}
              onValueChange={setSelectedVehicleTab}
              defaultValue={selectedVehicleTab || quoteForm.vehicles[0].vehicle.id}
            >
              <TabsList className="mb-4 flex overflow-x-auto pb-1">
                {quoteForm.vehicles.map(item => (
                  <TabsTrigger 
                    key={item.vehicle.id} 
                    value={item.vehicle.id}
                    className="whitespace-nowrap"
                  >
                    <Car className="h-4 w-4 mr-1" />
                    {item.vehicle.brand} {item.vehicle.model} 
                    {item.vehicle.plateNumber && ` (${item.vehicle.plateNumber})`}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {quoteForm.vehicles.map(item => (
                <TabsContent 
                  key={item.vehicle.id} 
                  value={item.vehicle.id}
                  className="mt-4"
                >
                  {renderVehicleParams(item.vehicle.id)}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
};

export default ParamsStep;
