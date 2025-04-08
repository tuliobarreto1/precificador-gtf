
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
  // Valor mínimo de ROIC (3%)
  const MIN_ROIC = 3.0;
  
  // Calcular o valor total dos veículos
  const totalVehicleValue = vehicleValues.reduce((sum, value) => sum + value, 0);
  
  // Calcular o ROIC inicial baseado no custo total mensal atual
  const calculateInitialRoic = () => {
    if (totalVehicleValue === 0) return MIN_ROIC;
    
    // ROIC anual = (totalCost * 12) / totalVehicleValue * 100
    const roic = (totalCost * 12) / totalVehicleValue * 100;
    return Math.max(roic, MIN_ROIC);
  };
  
  const [roicPercentage, setRoicPercentage] = useState<number>(calculateInitialRoic());
  
  // Recalcular o custo total baseado no ROIC atual
  const calculateAdjustedTotal = (roic: number) => {
    // Custo mensal = (totalVehicleValue * roic / 100) / 12
    return (totalVehicleValue * roic / 100) / 12;
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
          <p className="text-2xl font-bold text-primary">{roicPercentage.toFixed(1)}% a.a.</p>
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
          max={30}
          step={0.1}
          onValueChange={handleRoicChange}
          className="mt-2"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Min: {MIN_ROIC.toFixed(1)}%</span>
          <span>Sugerido: {calculateInitialRoic().toFixed(1)}%</span>
          <span>Max: 30.0%</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-md">
        <p>O ROIC (Retorno sobre o Capital Investido) representa o percentual anual de retorno sobre o valor total dos veículos.</p>
        <p className="mt-1">Valor total dos veículos: {formatCurrency(totalVehicleValue)}</p>
      </div>
    </div>
  );
};

export default RoicSlider;
