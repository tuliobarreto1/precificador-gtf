
import React from 'react';
import { VehicleParams } from '@/context/types/quoteTypes';
import Card from '@/components/ui-custom/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProtectionPlans } from '@/hooks/useProtectionPlans';

interface GlobalParamsFormProps {
  params: VehicleParams;
  onChangeContractMonths: (value: number) => void;
  onChangeMonthlyKm: (value: number) => void;
  onChangeOperationSeverity: (value: 1|2|3|4|5|6) => void;
  onChangeHasTracking: (value: boolean) => void;
  onChangeProtectionPlanId: (value: string | null) => void;
  onChangeIncludeIpva: (value: boolean) => void;
  onChangeIncludeLicensing: (value: boolean) => void;
  onChangeIncludeTaxes: (value: boolean) => void;
}

const GlobalParamsForm: React.FC<GlobalParamsFormProps> = ({
  params,
  onChangeContractMonths,
  onChangeMonthlyKm,
  onChangeOperationSeverity,
  onChangeHasTracking,
  onChangeProtectionPlanId,
  onChangeIncludeIpva,
  onChangeIncludeLicensing,
  onChangeIncludeTaxes
}) => {
  const { plans, loading: loadingPlans } = useProtectionPlans();
  
  const handleContractMonthsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 60) {
      onChangeContractMonths(value);
    }
  };
  
  const handleMonthlyKmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 10000) {
      onChangeMonthlyKm(value);
    }
  };
  
  const handleSeverityChange = (value: string) => {
    onChangeOperationSeverity(Number(value) as 1|2|3|4|5|6);
  };
  
  const handleProtectionPlanChange = (value: string) => {
    onChangeProtectionPlanId(value === 'none' ? null : value);
  };
  
  const severityOptions = [
    { value: 1, label: '1 - Muito Leve' },
    { value: 2, label: '2 - Leve' },
    { value: 3, label: '3 - Normal' },
    { value: 4, label: '4 - Moderado' },
    { value: 5, label: '5 - Severo' },
    { value: 6, label: '6 - Muito Severo' },
  ];
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Parâmetros de Contrato</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <Label htmlFor="contractMonths">Meses de Contrato</Label>
          <Input 
            id="contractMonths" 
            type="number" 
            min="1" 
            max="60"
            value={params.contractMonths} 
            onChange={handleContractMonthsChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Período total do contrato em meses
          </p>
        </div>
        
        <div>
          <Label htmlFor="monthlyKm">Quilometragem Mensal</Label>
          <Input 
            id="monthlyKm" 
            type="number" 
            min="500" 
            max="10000"
            value={params.monthlyKm} 
            onChange={handleMonthlyKmChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Quilometragem estimada por mês
          </p>
        </div>
        
        <div>
          <Label htmlFor="operationSeverity">Severidade de Operação</Label>
          <Select 
            value={params.operationSeverity.toString()} 
            onValueChange={handleSeverityChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a severidade" />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Impacto do tipo de uso no desgaste do veículo
          </p>
        </div>
        
        <div>
          <Label htmlFor="protectionPlan">Plano de Proteção</Label>
          <Select 
            value={params.protectionPlanId || 'none'} 
            onValueChange={handleProtectionPlanChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem plano de proteção</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.monthlyCost)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Proteção contra danos e acidentes
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="tracking" className="cursor-pointer">Rastreamento</Label>
            <p className="text-xs text-muted-foreground">
              Incluir serviço de rastreamento do veículo
            </p>
          </div>
          <Switch 
            id="tracking"
            checked={params.hasTracking}
            onCheckedChange={onChangeHasTracking}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="includeIpva" className="cursor-pointer">IPVA</Label>
            <p className="text-xs text-muted-foreground">
              Incluir valor do IPVA no contrato
            </p>
          </div>
          <Switch 
            id="includeIpva"
            checked={params.includeIpva}
            onCheckedChange={onChangeIncludeIpva}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="includeLicensing" className="cursor-pointer">Licenciamento</Label>
            <p className="text-xs text-muted-foreground">
              Incluir taxa de licenciamento no contrato
            </p>
          </div>
          <Switch 
            id="includeLicensing"
            checked={params.includeLicensing}
            onCheckedChange={onChangeIncludeLicensing}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="includeTaxes" className="cursor-pointer">Custos Financeiros</Label>
            <p className="text-xs text-muted-foreground">
              Incluir custos de impostos e taxas financeiras
            </p>
          </div>
          <Switch 
            id="includeTaxes"
            checked={params.includeTaxes}
            onCheckedChange={onChangeIncludeTaxes}
          />
        </div>
      </div>
    </Card>
  );
};

export default GlobalParamsForm;
