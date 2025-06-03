import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ProtectionPlanSelector } from '@/components/protection/ProtectionPlanSelector';
import { VehicleParamsCard } from '@/components/vehicle/VehicleParamsCard';
import { QuoteFormData, VehicleParams } from '@/context/types/quoteTypes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ParamsStepProps {
  quoteForm: QuoteFormData;
  setUseGlobalParams: (useGlobalParams: boolean) => void;
  setGlobalContractMonths: (contractMonths: number) => void;
  setGlobalMonthlyKm: (monthlyKm: number) => void;
  setGlobalOperationSeverity: (operationSeverity: 1|2|3|4|5|6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setGlobalProtectionPlanId: (protectionPlanId: string | null) => void;
  setGlobalIncludeIpva: (includeIpva: boolean) => void;
  setGlobalIncludeLicensing: (includeLicensing: boolean) => void;
  setGlobalIncludeTaxes: (includeTaxes: boolean) => void;
  setVehicleParams: (vehicleId: string, params: VehicleParams) => void;
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
  const [localParams, setLocalParams] = useState<VehicleParams>({
    contractMonths: 24,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: false,
    protectionPlanId: null,
    includeIpva: false,
    includeLicensing: false,
    includeTaxes: false
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {quoteForm.segment === 'Assinatura' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Segmento Assinatura:</strong> A severidade operacional é automaticamente definida como nível 1 (baixa) 
            para uso pessoal, com proteções otimizadas para este tipo de uso.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuração de Parâmetros</CardTitle>
          <CardDescription>
            Configure os parâmetros para todos os veículos ou individualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-global-params"
              checked={quoteForm.useGlobalParams}
              onCheckedChange={setUseGlobalParams}
            />
            <Label htmlFor="use-global-params">
              Usar parâmetros globais para todos os veículos
            </Label>
          </div>

          {quoteForm.useGlobalParams ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parâmetros Globais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract-months">Meses de Contrato</Label>
                  <Select 
                    value={quoteForm.globalParams.contractMonths.toString()} 
                    onValueChange={(value) => setGlobalContractMonths(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="18">18 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                      <SelectItem value="36">36 meses</SelectItem>
                      <SelectItem value="48">48 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="monthly-km">Quilometragem Mensal</Label>
                  <Input
                    id="monthly-km"
                    type="number"
                    value={quoteForm.globalParams.monthlyKm}
                    onChange={(e) => setGlobalMonthlyKm(parseInt(e.target.value) || 0)}
                    placeholder="Km por mês"
                  />
                </div>

                <div>
                  <Label htmlFor="operation-severity">Severidade Operacional</Label>
                  <Select 
                    value={quoteForm.globalParams.operationSeverity.toString()} 
                    onValueChange={(value) => setGlobalOperationSeverity(parseInt(value) as 1|2|3|4|5|6)}
                    disabled={quoteForm.segment === 'Assinatura'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Muito Baixa</SelectItem>
                      <SelectItem value="2">2 - Baixa</SelectItem>
                      <SelectItem value="3">3 - Média</SelectItem>
                      <SelectItem value="4">4 - Alta</SelectItem>
                      <SelectItem value="5">5 - Muito Alta</SelectItem>
                      <SelectItem value="6">6 - Extrema</SelectItem>
                    </SelectContent>
                  </Select>
                  {quoteForm.segment === 'Assinatura' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fixado em nível 1 para o segmento Assinatura
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="has-tracking"
                    checked={quoteForm.globalParams.hasTracking}
                    onCheckedChange={setGlobalHasTracking}
                  />
                  <Label htmlFor="has-tracking">Incluir Rastreamento</Label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Plano de Proteção</h4>
                <ProtectionPlanSelector
                  selectedPlanId={quoteForm.globalParams.protectionPlanId}
                  onChange={setGlobalProtectionPlanId}
                  segment={quoteForm.segment}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Custos Adicionais</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-ipva"
                      checked={quoteForm.globalParams.includeIpva}
                      onCheckedChange={setGlobalIncludeIpva}
                    />
                    <Label htmlFor="include-ipva">Incluir IPVA</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-licensing"
                      checked={quoteForm.globalParams.includeLicensing}
                      onCheckedChange={setGlobalIncludeLicensing}
                    />
                    <Label htmlFor="include-licensing">Incluir Licenciamento</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-taxes"
                      checked={quoteForm.globalParams.includeTaxes}
                      onCheckedChange={setGlobalIncludeTaxes}
                    />
                    <Label htmlFor="include-taxes">Incluir Custos Financeiros</Label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parâmetros Individuais por Veículo</h3>
              {quoteForm.vehicles.map((item, index) => (
                <VehicleParamsCard
                  key={item.vehicle.id}
                  vehicle={item.vehicle}
                  vehicleGroup={item.vehicleGroup}
                  params={item.params || quoteForm.globalParams}
                  onParamsChange={(params) => setVehicleParams(item.vehicle.id, params)}
                  segment={quoteForm.segment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParamsStep;
