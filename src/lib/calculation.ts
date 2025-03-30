// Calculation service for lease pricing
import { supabase } from '@/integrations/supabase/client';
import { fetchCalculationParams, fetchVehicleGroups } from './settings';

// Types
export type DepreciationParams = {
  vehicleValue: number;
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
};

export type MaintenanceParams = {
  vehicleGroup: string;
  contractMonths: number;
  monthlyKm: number;
  hasTracking: boolean;
};

// Global parameters that can be configured
export type GlobalParams = {
  trackingCost: number;
  depreciationRates: {
    base: number;
    mileageMultiplier: number;
    severityMultiplier: number;
  };
  extraKmPercentage: number;
};

// Versão em cache dos parâmetros globais para melhor performance
let cachedGlobalParams: GlobalParams | null = null;
let cachedVehicleGroups: Record<string, { revisionCost: number, revisionInterval: number, tireCost: number, tireInterval: number }> | null = null;
let lastGlobalParamsFetch = 0;
let lastVehicleGroupsFetch = 0;
const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos

// Default global parameters (usados apenas como fallback)
const defaultGlobalParams: GlobalParams = {
  trackingCost: 50,
  depreciationRates: {
    base: 0.015,
    mileageMultiplier: 0.05,
    severityMultiplier: 0.1
  },
  extraKmPercentage: 0.0000075 // 0,00075% do valor do veículo por km
};

// Function to get global parameters
export const getGlobalParams = async (): Promise<GlobalParams> => {
  const now = Date.now();
  
  // Verificar se os parâmetros em cache ainda são válidos
  if (cachedGlobalParams && (now - lastGlobalParamsFetch) < CACHE_VALIDITY_MS) {
    return { ...cachedGlobalParams };
  }
  
  try {
    const params = await fetchCalculationParams();
    
    if (params) {
      cachedGlobalParams = {
        trackingCost: params.tracking_cost,
        depreciationRates: {
          base: params.depreciation_base,
          mileageMultiplier: params.depreciation_mileage_multiplier,
          severityMultiplier: params.depreciation_severity_multiplier
        },
        extraKmPercentage: params.extra_km_percentage
      };
      
      lastGlobalParamsFetch = now;
      return { ...cachedGlobalParams };
    }
  } catch (error) {
    console.error('Erro ao buscar parâmetros de cálculo do banco de dados:', error);
  }
  
  // Fallback para os parâmetros padrão
  return { ...defaultGlobalParams };
};

// Function para manter retrocompatibilidade (versão síncrona)
export const getGlobalParamsSync = (): GlobalParams => {
  if (cachedGlobalParams) {
    return { ...cachedGlobalParams };
  }
  return { ...defaultGlobalParams };
};

// Função para buscar grupos de veículos e preparar para cálculos
export const getVehicleGroupsMap = async (): Promise<Record<string, { revisionCost: number, revisionInterval: number, tireCost: number, tireInterval: number }>> => {
  const now = Date.now();
  
  // Verificar se os grupos em cache ainda são válidos
  if (cachedVehicleGroups && (now - lastVehicleGroupsFetch) < CACHE_VALIDITY_MS) {
    return { ...cachedVehicleGroups };
  }
  
  try {
    const groups = await fetchVehicleGroups();
    
    if (groups && groups.length > 0) {
      const groupsMap = groups.reduce((map, group) => {
        map[group.code] = {
          revisionCost: group.revision_cost,
          revisionInterval: group.revision_km,
          tireCost: group.tire_cost,
          tireInterval: group.tire_km
        };
        return map;
      }, {} as Record<string, { revisionCost: number, revisionInterval: number, tireCost: number, tireInterval: number }>);
      
      cachedVehicleGroups = groupsMap;
      lastVehicleGroupsFetch = now;
      return { ...cachedVehicleGroups };
    }
  } catch (error) {
    console.error('Erro ao buscar grupos de veículos do banco de dados:', error);
  }
  
  // Default fallback (usado apenas se não conseguir buscar do banco)
  return {
    'A': { revisionCost: 300, revisionInterval: 10000, tireCost: 1200, tireInterval: 40000 },
    'B': { revisionCost: 350, revisionInterval: 15000, tireCost: 1400, tireInterval: 45000 },
    'C': { revisionCost: 400, revisionInterval: 20000, tireCost: 1600, tireInterval: 50000 }
  };
};

// Função síncrona para retrocompatibilidade
export const getVehicleGroupsMapSync = (): Record<string, { revisionCost: number, revisionInterval: number, tireCost: number, tireInterval: number }> => {
  if (cachedVehicleGroups) {
    return { ...cachedVehicleGroups };
  }
  return {
    'A': { revisionCost: 300, revisionInterval: 10000, tireCost: 1200, tireInterval: 40000 },
    'B': { revisionCost: 350, revisionInterval: 15000, tireCost: 1400, tireInterval: 45000 },
    'C': { revisionCost: 400, revisionInterval: 20000, tireCost: 1600, tireInterval: 50000 }
  };
};

// Backward compatibility update function
export const updateGlobalParams = (params: Partial<GlobalParams>) => {
  if (cachedGlobalParams) {
    cachedGlobalParams = { ...cachedGlobalParams, ...params };
  } else {
    cachedGlobalParams = { ...defaultGlobalParams, ...params };
  }
};

// Base depreciation calculation
export const calculateDepreciation = async (params: DepreciationParams): Promise<number> => {
  const { vehicleValue, contractMonths, monthlyKm, operationSeverity } = params;
  
  // Buscar parâmetros globais do banco de dados
  const globalParams = await getGlobalParams();
  
  // Base depreciation rate using global params
  let baseRate = globalParams.depreciationRates.base * (25 - contractMonths) / 12;
  
  // Adjust for mileage (higher mileage = higher depreciation)
  const mileageMultiplier = 1 + ((monthlyKm - 1000) / 5000) * globalParams.depreciationRates.mileageMultiplier;
  
  // Adjust for severity (higher severity = higher depreciation)
  const severityMultiplier = 1 + (operationSeverity - 1) * globalParams.depreciationRates.severityMultiplier;
  
  // Calculate monthly depreciation
  const monthlyDepreciation = vehicleValue * baseRate * mileageMultiplier * severityMultiplier;
  
  return monthlyDepreciation;
};

// Versão síncrona para retrocompatibilidade
export const calculateDepreciationSync = (params: DepreciationParams): number => {
  const { vehicleValue, contractMonths, monthlyKm, operationSeverity } = params;
  
  // Usar parâmetros em cache para cálculo síncrono
  const globalParams = getGlobalParamsSync();
  
  // Base depreciation rate using global params
  let baseRate = globalParams.depreciationRates.base * (25 - contractMonths) / 12;
  
  // Adjust for mileage (higher mileage = higher depreciation)
  const mileageMultiplier = 1 + ((monthlyKm - 1000) / 5000) * globalParams.depreciationRates.mileageMultiplier;
  
  // Adjust for severity (higher severity = higher depreciation)
  const severityMultiplier = 1 + (operationSeverity - 1) * globalParams.depreciationRates.severityMultiplier;
  
  // Calculate monthly depreciation
  const monthlyDepreciation = vehicleValue * baseRate * mileageMultiplier * severityMultiplier;
  
  return monthlyDepreciation;
};

// Calculate maintenance costs
export const calculateMaintenance = async (params: MaintenanceParams): Promise<number> => {
  const { vehicleGroup, contractMonths, monthlyKm, hasTracking } = params;
  
  // Buscar grupos de veículos e parâmetros globais do banco de dados
  const [groupCosts, globalParams] = await Promise.all([
    getVehicleGroupsMap(),
    getGlobalParams()
  ]);
  
  // Default to group A if not found
  const costs = groupCosts[vehicleGroup] || groupCosts['A'];
  
  // Calculate number of revisions and tire changes over contract
  const totalKm = monthlyKm * contractMonths;
  const revisions = Math.max(1, Math.ceil(totalKm / costs.revisionInterval));
  const tireChanges = Math.max(0, Math.ceil(totalKm / costs.tireInterval));
  
  // Calculate monthly maintenance cost
  const totalMaintenanceCost = (costs.revisionCost * revisions) + (costs.tireCost * tireChanges);
  const monthlyMaintenanceCost = totalMaintenanceCost / contractMonths;
  
  // Add tracking cost if selected (using global param)
  const trackingCost = hasTracking ? globalParams.trackingCost : 0;
  
  return monthlyMaintenanceCost + trackingCost;
};

// Versão síncrona para retrocompatibilidade
export const calculateMaintenanceSync = (params: MaintenanceParams): number => {
  const { vehicleGroup, contractMonths, monthlyKm, hasTracking } = params;
  
  // Usar dados em cache para cálculo síncrono
  const groupCosts = getVehicleGroupsMapSync();
  const globalParams = getGlobalParamsSync();
  
  // Default to group A if not found
  const costs = groupCosts[vehicleGroup] || groupCosts['A'];
  
  // Calculate number of revisions and tire changes over contract
  const totalKm = monthlyKm * contractMonths;
  const revisions = Math.max(1, Math.ceil(totalKm / costs.revisionInterval));
  const tireChanges = Math.max(0, Math.ceil(totalKm / costs.tireInterval));
  
  // Calculate monthly maintenance cost
  const totalMaintenanceCost = (costs.revisionCost * revisions) + (costs.tireCost * tireChanges);
  const monthlyMaintenanceCost = totalMaintenanceCost / contractMonths;
  
  // Add tracking cost if selected (using global param)
  const trackingCost = hasTracking ? globalParams.trackingCost : 0;
  
  return monthlyMaintenanceCost + trackingCost;
};

// Calculate extra km rate
export const calculateExtraKmRate = (vehicleValue: number): number => {
  // Percentual do valor do veículo para cobrar por KM extra
  // Este valor poderia vir do banco de dados ou configurações
  // Por exemplo, 0,00075% do valor do veículo por KM
  const DEFAULT_RATE = 0.0000075;
  return vehicleValue * DEFAULT_RATE;
};

// Versão síncrona para retrocompatibilidade
export const calculateExtraKmRateSync = (vehicleValue: number): number => {
  const globalParams = getGlobalParamsSync();
  return vehicleValue * globalParams.extraKmPercentage;
};

// Calculate total monthly lease cost (versão assíncrona)
export const calculateLeaseCost = async (
  depreciationParams: DepreciationParams,
  maintenanceParams: MaintenanceParams
): Promise<{
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  totalCost: number;
  costPerKm: number;
}> => {
  const [depreciationCost, maintenanceCost, globalParams] = await Promise.all([
    calculateDepreciation(depreciationParams),
    calculateMaintenance(maintenanceParams),
    getGlobalParams()
  ]);
  
  const trackingCost = maintenanceParams.hasTracking ? globalParams.trackingCost : 0;
  const totalCost = depreciationCost + maintenanceCost;
  const costPerKm = totalCost / maintenanceParams.monthlyKm;
  
  return {
    depreciationCost,
    maintenanceCost: maintenanceCost - trackingCost, // Pure maintenance without tracking
    trackingCost,
    totalCost,
    costPerKm
  };
};

// Versão síncrona para retrocompatibilidade
export const calculateLeaseCostSync = (
  depreciationParams: DepreciationParams,
  maintenanceParams: MaintenanceParams
): {
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  totalCost: number;
  costPerKm: number;
} => {
  const depreciationCost = calculateDepreciationSync(depreciationParams);
  const maintenanceCost = calculateMaintenanceSync(maintenanceParams);
  const globalParams = getGlobalParamsSync();
  
  const trackingCost = maintenanceParams.hasTracking ? globalParams.trackingCost : 0;
  const totalCost = depreciationCost + maintenanceCost;
  const costPerKm = totalCost / maintenanceParams.monthlyKm;
  
  return {
    depreciationCost,
    maintenanceCost: maintenanceCost - trackingCost, // Pure maintenance without tracking
    trackingCost,
    totalCost,
    costPerKm
  };
};

// Iniciar carregando os dados do banco para o cache
(async () => {
  try {
    await getGlobalParams();
    await getVehicleGroupsMap();
    console.log('Parâmetros de cálculo inicializados com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar parâmetros de cálculo:', error);
  }
})();
