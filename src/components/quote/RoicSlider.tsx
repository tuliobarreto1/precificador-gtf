
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoicSliderProps {
  totalCost: number;
  vehicleValues: number[];
  onRoicChange: (roicPercentage: number, adjustedTotal: number, justification?: { reason: string, authorizedBy: string }) => void;
}

const RoicSlider: React.FC<RoicSliderProps> = ({ 
  totalCost, 
  vehicleValues, 
  onRoicChange 
}) => {
  // Valor mínimo de ROIC mensal (3.0%, que equivale a 36% anual)
  const MIN_ROIC = 3.0;
  
  // Valor máximo de ROIC mensal (8.0%)
  const MAX_ROIC = 8.0;
  
  // Calcular o valor total dos veículos
  const totalVehicleValue = vehicleValues.reduce((sum, value) => sum + value, 0);
  
  // Calcular o ROIC inicial baseado no custo total mensal atual
  const calculateInitialRoic = () => {
    if (totalVehicleValue === 0) return MIN_ROIC;
    
    // ROIC mensal = (totalCost / totalVehicleValue) * 100
    const roic = (totalCost / totalVehicleValue) * 100;
    return Math.max(roic, MIN_ROIC);
  };
  
  const [roicPercentage, setRoicPercentage] = useState<number>(calculateInitialRoic());
  const [showJustification, setShowJustification] = useState<boolean>(false);
  const [justification, setJustification] = useState<string>('');
  const [authorizedBy, setAuthorizedBy] = useState<string>('');
  const [initialRoic] = useState<number>(calculateInitialRoic());
  
  // Recalcular o custo total baseado no ROIC atual
  const calculateAdjustedTotal = (roic: number) => {
    // Custo mensal = totalVehicleValue * (roic / 100)
    return (totalVehicleValue * roic / 100);
  };

  // Converter ROIC mensal para anual
  const getAnnualRate = (monthlyRate: number) => {
    return ((1 + monthlyRate/100) ** 12 - 1) * 100;
  };

  useEffect(() => {
    // Quando o componente é montado ou quando totalCost ou vehicleValues mudam
    const initialRoic = calculateInitialRoic();
    setRoicPercentage(initialRoic);
  }, [totalCost, totalVehicleValue]);

  const handleRoicChange = (value: number[]) => {
    const newRoic = value[0];
    setRoicPercentage(newRoic);
    
    // Verificar se o novo ROIC é menor que o sugerido
    if (newRoic < initialRoic) {
      setShowJustification(true);
    } else {
      setShowJustification(false);
      // Resetar os campos quando não precisamos de justificativa
      setJustification('');
      setAuthorizedBy('');
    }
    
    const adjustedTotal = calculateAdjustedTotal(newRoic);
    
    // Se não precisamos de justificativa ou se os campos estão preenchidos
    if (!showJustification || (justification && authorizedBy)) {
      onRoicChange(
        newRoic, 
        adjustedTotal, 
        showJustification ? { reason: justification, authorizedBy } : undefined
      );
    } else {
      // Caso contrário, apenas atualiza o valor sem passar a justificativa
      onRoicChange(newRoic, adjustedTotal);
    }
  };

  const handleJustificationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJustification(e.target.value);
    
    if (e.target.value && authorizedBy) {
      onRoicChange(
        roicPercentage, 
        calculateAdjustedTotal(roicPercentage), 
        { reason: e.target.value, authorizedBy }
      );
    }
  };

  const handleAuthorizedByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthorizedBy(e.target.value);
    
    if (justification && e.target.value) {
      onRoicChange(
        roicPercentage, 
        calculateAdjustedTotal(roicPercentage), 
        { reason: justification, authorizedBy: e.target.value }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Retorno sobre o Capital Investido (ROIC)</p>
          <p className="text-2xl font-bold text-primary">{roicPercentage.toFixed(2)}% a.m.</p>
          <p className="text-xs text-muted-foreground">Equivalente a {getAnnualRate(roicPercentage).toFixed(2)}% a.a.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">Valor Ajustado</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(calculateAdjustedTotal(roicPercentage))}/mês</p>
        </div>
      </div>
      
      <div className="px-2">
        <Slider
          value={[roicPercentage]}
          min={MIN_ROIC}
          max={MAX_ROIC}
          step={0.01}
          onValueChange={handleRoicChange}
          className="mt-2"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Min: {MIN_ROIC.toFixed(2)}% a.m.</span>
          <span>Sugerido: {initialRoic.toFixed(2)}% a.m.</span>
          <span>Max: {MAX_ROIC.toFixed(2)}% a.m.</span>
        </div>
      </div>
      
      {/* Campos de justificativa quando o ROIC é menor que o sugerido */}
      {showJustification && (
        <div className="mt-4 space-y-3 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
          <div>
            <p className="text-sm font-medium text-amber-800 mb-2">
              Justificativa obrigatória para ROIC abaixo do valor sugerido
            </p>
            <Label htmlFor="justification" className="text-sm text-muted-foreground">
              Motivo da alteração <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Informe o motivo para redução do ROIC"
              value={justification}
              onChange={handleJustificationChange}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="authorizedBy" className="text-sm text-muted-foreground">
              Autorizado por <span className="text-red-500">*</span>
            </Label>
            <Input
              id="authorizedBy"
              placeholder="Nome do autorizador"
              value={authorizedBy}
              onChange={handleAuthorizedByChange}
              required
              className="mt-1"
            />
          </div>
          
          {(!justification || !authorizedBy) && (
            <p className="text-xs text-red-500 mt-1">
              Ambos os campos são obrigatórios para aplicar o desconto.
            </p>
          )}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-md">
        <p>O ROIC (Retorno sobre o Capital Investido) representa o percentual mensal de retorno sobre o valor total dos veículos.</p>
        <p className="mt-1">Valor total dos veículos: {formatCurrency(totalVehicleValue)}</p>
      </div>
    </div>
  );
};

export default RoicSlider;
