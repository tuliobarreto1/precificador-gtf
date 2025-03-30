
import { supabase } from '@/integrations/supabase/client';

// Interfaces
export interface DepreciationParams {
  vehicleValue: number;
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1|2|3|4|5|6;
}

export interface MaintenanceParams {
  vehicleGroup: string;
  contractMonths: number;
  monthlyKm: number;
  hasTracking: boolean;
}

// Parâmetros padrão
let defaultParams = {
  tracking_cost: 150,
  depreciation_base: 0.1,
  depreciation_mileage_multiplier: 0.000015,
  depreciation_severity_multiplier: 0.3,
  extra_km_percentage: 0.00015
};

// Grupos de veículos padrão
let vehicleGroups: Record<string, {
  revision_km: number;
  revision_cost: number;
  tire_km: number;
  tire_cost: number;
}> = {};

// Inicializar parâmetros de cálculo a partir do banco de dados
export async function initCalculationParams() {
  try {
    // Buscar parâmetros de cálculo
    const { data: calculationParams, error: paramsError } = await supabase
      .from('calculation_params')
      .select('*')
      .limit(1)
      .single();
      
    if (paramsError) {
      if (paramsError.code !== 'PGRST116') { // Código para 'não encontrado'
        console.error('Erro ao buscar parâmetros de cálculo:', paramsError);
      }
    } else if (calculationParams) {
      defaultParams = {
        tracking_cost: calculationParams.tracking_cost,
        depreciation_base: calculationParams.depreciation_base,
        depreciation_mileage_multiplier: calculationParams.depreciation_mileage_multiplier,
        depreciation_severity_multiplier: calculationParams.depreciation_severity_multiplier,
        extra_km_percentage: calculationParams.extra_km_percentage
      };
      console.log('Parâmetros de cálculo carregados do banco:', defaultParams);
    }
    
    // Buscar grupos de veículos
    const { data: groups, error: groupsError } = await supabase
      .from('vehicle_groups')
      .select('*');
      
    if (groupsError) {
      console.error('Erro ao buscar grupos de veículos:', groupsError);
    } else if (groups && groups.length > 0) {
      // Mapear os grupos de veículos por código/letra
      groups.forEach(group => {
        vehicleGroups[group.code] = {
          revision_km: group.revision_km,
          revision_cost: group.revision_cost,
          tire_km: group.tire_km,
          tire_cost: group.tire_cost
        };
        
        // Também mapear por id para garantir compatibilidade
        vehicleGroups[group.id] = {
          revision_km: group.revision_km,
          revision_cost: group.revision_cost,
          tire_km: group.tire_km,
          tire_cost: group.tire_cost
        };
      });
      console.log('Grupos de veículos carregados do banco:', Object.keys(vehicleGroups).length);
    }
    
    console.log('Parâmetros de cálculo inicializados com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar parâmetros de cálculo:', error);
  }
}

// Inicializar parâmetros de cálculo
initCalculationParams();

// Valor padrão de grupo se não for encontrado
const defaultGroupParams = {
  revision_km: 10000,
  revision_cost: 500,
  tire_km: 40000,
  tire_cost: 2000
};

// Função para calcular a depreciação
export const calculateDepreciation = async (params: DepreciationParams): Promise<number> => {
  await initCalculationParams();
  return calculateDepreciationSync(params);
};

// Versão síncrona do cálculo de depreciação
export const calculateDepreciationSync = (params: DepreciationParams): number => {
  const { vehicleValue, contractMonths, monthlyKm, operationSeverity } = params;
  
  // Cálculos de depreciação com base nos parâmetros do DB
  const totalDistance = monthlyKm * contractMonths;
  const severityFactor = defaultParams.depreciation_severity_multiplier * operationSeverity;
  const distanceFactor = defaultParams.depreciation_mileage_multiplier * totalDistance;
  
  // Base de depreciação aplicada ao valor do veículo
  const baseDepreciation = vehicleValue * defaultParams.depreciation_base / contractMonths;
  
  // Ajuste de depreciação com base no uso e severidade
  const usageDepreciation = vehicleValue * (distanceFactor + severityFactor) / contractMonths;
  
  // Depreciação mensal total
  const monthlyDepreciation = baseDepreciation + usageDepreciation;
  
  console.log(`Depreciação calculada para veículo de R$ ${vehicleValue}: R$ ${monthlyDepreciation.toFixed(2)}`);
  return parseFloat(monthlyDepreciation.toFixed(2));
};

// Função para calcular custo de manutenção
export const calculateMaintenance = async (params: MaintenanceParams): Promise<number> => {
  await initCalculationParams();
  return calculateMaintenanceSync(params);
};

// Versão síncrona do cálculo de manutenção
export const calculateMaintenanceSync = (params: MaintenanceParams): number => {
  const { vehicleGroup, contractMonths, monthlyKm, hasTracking } = params;
  
  // Obter parâmetros do grupo de veículo
  let groupParams = vehicleGroups[vehicleGroup] || defaultGroupParams;
  
  console.log(`Usando parâmetros do grupo ${vehicleGroup}:`, groupParams);
  
  // Cálculo de revisões baseado na quilometragem
  const totalKm = monthlyKm * contractMonths;
  const revisionCount = Math.max(1, Math.ceil(totalKm / groupParams.revision_km));
  const revisionCost = revisionCount * groupParams.revision_cost / contractMonths;
  
  // Cálculo de pneus baseado na quilometragem
  const tireSetCount = Math.max(0, Math.ceil(totalKm / groupParams.tire_km));
  const tireCost = tireSetCount * groupParams.tire_cost / contractMonths;
  
  // Custo de rastreamento
  const trackingCost = hasTracking ? defaultParams.tracking_cost : 0;
  
  // Custo total mensal de manutenção
  const maintenanceCost = revisionCost + tireCost + trackingCost;
  
  console.log(`Manutenção calculada para grupo ${vehicleGroup}: R$ ${maintenanceCost.toFixed(2)} (revisões: ${revisionCost.toFixed(2)}, pneus: ${tireCost.toFixed(2)}, rastreamento: ${trackingCost})`);
  return parseFloat(maintenanceCost.toFixed(2));
};

// Função para calcular taxa de quilometragem excedente
export const calculateExtraKmRate = async (vehicleValue: number): Promise<number> => {
  await initCalculationParams();
  return calculateExtraKmRateSync(vehicleValue);
};

// Versão síncrona do cálculo de taxa de quilometragem excedente
export const calculateExtraKmRateSync = (vehicleValue: number): number => {
  // Taxa básica por quilômetro excedente com base no valor do veículo
  const rate = vehicleValue * defaultParams.extra_km_percentage;
  return parseFloat(rate.toFixed(2));
};

// Função para calcular seguro (simplificada, ajustar conforme necessidade)
export const calculateInsurance = (vehicleValue: number, contractMonths: number): number => {
  // Taxa básica de seguro anual (exemplo: 3% do valor do veículo)
  const annualRate = 0.03;
  const annualCost = vehicleValue * annualRate;
  
  // Custo mensal do seguro
  const monthlyCost = annualCost / 12;
  
  return parseFloat(monthlyCost.toFixed(2));
};

export const calculateVehicleQuote = async (
  vehicleValue: number,
  groupId: string,
  contractMonths: number,
  monthlyKm: number,
  operationSeverity: 1|2|3|4|5|6,
  hasTracking: boolean
): Promise<{
  depreciationCost: number;
  maintenanceCost: number;
  insuranceCost: number;
  trackingCost: number;
  totalCost: number;
  extraKmRate: number;
}> => {
  // Cálculo de depreciação
  const depreciationCost = await calculateDepreciation({
    vehicleValue,
    contractMonths,
    monthlyKm,
    operationSeverity
  });
  
  // Cálculo de manutenção
  const maintenanceParams = {
    vehicleGroup: groupId,
    contractMonths,
    monthlyKm,
    hasTracking
  };
  const maintenanceCost = await calculateMaintenance(maintenanceParams);
  
  // Cálculo de seguro
  const insuranceCost = calculateInsurance(vehicleValue, contractMonths);
  
  // Custo de rastreamento
  const trackingCost = hasTracking ? defaultParams.tracking_cost : 0;
  
  // Taxa de quilometragem excedente
  const extraKmRate = await calculateExtraKmRate(vehicleValue);
  
  // Custo total mensal
  const totalCost = depreciationCost + maintenanceCost + insuranceCost;
  
  return {
    depreciationCost,
    maintenanceCost,
    insuranceCost,
    trackingCost,
    totalCost,
    extraKmRate
  };
};
