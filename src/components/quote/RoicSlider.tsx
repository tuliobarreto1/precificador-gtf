
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Slider } from "@/components/ui/slider";

interface RoicSliderProps {
  totalCost: number;
  vehicleValues: number[];
  onRoicChange: (roicPercentage: number, adjustedTotal: number) => void;
}

const RoicSlider: React.FC<RoicSliderProps> = ({ 
  totalCost, 
  vehicleValues, 
  onRoicChange 
}) => {
  // Valor mínimo de ROIC mensal (0.25%, que equivale a 3% anual)
  const MIN_ROIC = 0.25;
  
  // Calcular o valor total dos veículos
  const totalVehicleValue = vehicleValues.reduce((sum, value) => sum + value, 0);
  
  // Calcular o ROIC inicial baseado no custo total mensal atual
  const calculateInitialRoic = () => {
    if (totalVehicleValue === 0) return MIN_ROIC;
    
    // ROIC mensal = totalCost / totalVehicleValue * 100
    const roic = (totalCost / totalVehicleValue) * 100;
    return Math.max(roic, MIN_ROIC);
  };
  
  const [roicPercentage, setRoicPercentage] = useState<number>(calculateInitialRoic());
  
  // Recalcular o custo total baseado no ROIC atual
  const calculateAdjustedTotal = (roic: number) => {
    // Custo mensal = totalVehicleValue * roic / 100
    return (totalVehicleValue * roic / 100);
  };

  // Converter ROIC mensal para anual
  const getAnnualRate = (monthlyRate: number) => {
    return monthlyRate * 12;
  };

  useEffect(() => {
    // Quando o componente é montado ou quando totalCost ou vehicleValues mudam
    const initialRoic = calculateInitialRoic();
    setRoicPercentage(initialRoic);
  }, [totalCost, totalVehicleValue]);

  const handleRoicChange = (value: number[]) => {
    const newRoic = value[0];
    setRoicPercentage(newRoic);
    
    const adjustedTotal = calculateAdjustedTotal(newRoic);
    onRoicChange(newRoic, adjustedTotal);
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
          max={3.0}
          step={0.01}
          onValueChange={handleRoicChange}
          className="mt-2"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Min: {MIN_ROIC.toFixed(2)}% a.m.</span>
          <span>Sugerido: {calculateInitialRoic().toFixed(2)}% a.m.</span>
          <span>Max: 3.00% a.m.</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-md">
        <p>O ROIC (Retorno sobre o Capital Investido) representa o percentual mensal de retorno sobre o valor total dos veículos.</p>
        <p className="mt-1">Valor total dos veículos: {formatCurrency(totalVehicleValue)}</p>
      </div>
    </div>
  );
};

export default RoicSlider;
