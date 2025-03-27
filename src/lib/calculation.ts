
// Calculation service for lease pricing

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

// Default global parameters
let globalParams: GlobalParams = {
  trackingCost: 50,
  depreciationRates: {
    base: 0.01,
    mileageMultiplier: 0.2,
    severityMultiplier: 0.05
  },
  extraKmPercentage: 0.01 // 1% of vehicle value per km
};

// Function to update global parameters
export const updateGlobalParams = (params: Partial<GlobalParams>) => {
  globalParams = { ...globalParams, ...params };
};

// Function to get global parameters
export const getGlobalParams = (): GlobalParams => {
  return { ...globalParams };
};

// Base depreciation calculation
export const calculateDepreciation = (params: DepreciationParams): number => {
  const { vehicleValue, contractMonths, monthlyKm, operationSeverity } = params;
  
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
export const calculateMaintenance = (params: MaintenanceParams): number => {
  const { vehicleGroup, contractMonths, monthlyKm, hasTracking } = params;
  
  // Sample maintenance costs by vehicle group (simplified)
  const groupCosts: Record<string, { revisionCost: number, revisionInterval: number, tireCost: number, tireInterval: number }> = {
    'A': { revisionCost: 300, revisionInterval: 10000, tireCost: 1200, tireInterval: 40000 },
    'B': { revisionCost: 350, revisionInterval: 10000, tireCost: 1400, tireInterval: 40000 },
    'C': { revisionCost: 400, revisionInterval: 10000, tireCost: 1600, tireInterval: 40000 },
    // Add more groups as needed
  };
  
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
  return vehicleValue * globalParams.extraKmPercentage;
};

// Calculate total monthly lease cost
export const calculateLeaseCost = (
  depreciationParams: DepreciationParams,
  maintenanceParams: MaintenanceParams
): {
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  totalCost: number;
  costPerKm: number;
} => {
  const depreciationCost = calculateDepreciation(depreciationParams);
  const maintenanceCost = calculateMaintenance(maintenanceParams);
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
