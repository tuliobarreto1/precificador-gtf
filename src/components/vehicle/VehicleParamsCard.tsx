
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { VehicleParams } from '@/context/types/quoteTypes';
import ProtectionPlanSelector from '@/components/protection/ProtectionPlanSelector';

interface VehicleParamsCardProps {
  vehicle: Vehicle;
  vehicleGroup?: VehicleGroup;
  params: VehicleParams;
  onParamsChange: (params: VehicleParams) => void;
  segment?: 'GTF' | 'Assinatura';
}

export const VehicleParamsCard: React.FC<VehicleParamsCardProps> = ({
  vehicle,
  vehicleGroup,
  params,
  onParamsChange,
  segment
}) => {
  const updateParam = <K extends keyof VehicleParams>(key: K, value: VehicleParams[K]) => {
    onParamsChange({
      ...params,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </CardTitle>
        {vehicleGroup && (
          <p className="text-sm text-muted-foreground">
            Grupo: {vehicleGroup.name}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`contract-months-${vehicle.id}`}>Meses de Contrato</Label>
            <Select 
              value={params.contractMonths.toString()} 
              onValueChange={(value) => updateParam('contractMonths', parseInt(value))}
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
            <Label htmlFor={`monthly-km-${vehicle.id}`}>Quilometragem Mensal</Label>
            <Input
              id={`monthly-km-${vehicle.id}`}
              type="number"
              value={params.monthlyKm}
              onChange={(e) => updateParam('monthlyKm', parseInt(e.target.value) || 0)}
              placeholder="Km por mês"
            />
          </div>

          <div>
            <Label htmlFor={`operation-severity-${vehicle.id}`}>Severidade Operacional</Label>
            <Select 
              value={params.operationSeverity.toString()} 
              onValueChange={(value) => updateParam('operationSeverity', parseInt(value) as 1|2|3|4|5|6)}
              disabled={segment === 'Assinatura'}
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
            {segment === 'Assinatura' && (
              <p className="text-xs text-muted-foreground mt-1">
                Fixado em nível 1 para o segmento Assinatura
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id={`has-tracking-${vehicle.id}`}
              checked={params.hasTracking}
              onCheckedChange={(checked) => updateParam('hasTracking', checked)}
            />
            <Label htmlFor={`has-tracking-${vehicle.id}`}>Incluir Rastreamento</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Plano de Proteção</h4>
          <ProtectionPlanSelector
            selectedPlanId={params.protectionPlanId}
            onChange={(planId) => updateParam('protectionPlanId', planId)}
            segment={segment}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Custos Adicionais</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`include-ipva-${vehicle.id}`}
                checked={params.includeIpva}
                onCheckedChange={(checked) => updateParam('includeIpva', checked)}
              />
              <Label htmlFor={`include-ipva-${vehicle.id}`}>Incluir IPVA</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id={`include-licensing-${vehicle.id}`}
                checked={params.includeLicensing}
                onCheckedChange={(checked) => updateParam('includeLicensing', checked)}
              />
              <Label htmlFor={`include-licensing-${vehicle.id}`}>Incluir Licenciamento</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id={`include-taxes-${vehicle.id}`}
                checked={params.includeTaxes}
                onCheckedChange={(checked) => updateParam('includeTaxes', checked)}
              />
              <Label htmlFor={`include-taxes-${vehicle.id}`}>Incluir Custos Financeiros</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
