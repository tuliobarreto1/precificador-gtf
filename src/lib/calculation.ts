
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

// Base depreciation calculation
export const calculateDepreciation = (params: DepreciationParams): number => {
  const { vehicleValue, contractMonths, monthlyKm, operationSeverity } = params;
  
  // Base depreciation rate (example formula)
  let baseRate = 0.01 * (25 - contractMonths) / 12;
  
  // Adjust for mileage (higher mileage = higher depreciation)
  const mileageMultiplier = 1 + ((monthlyKm - 1000) / 5000) * 0.2;
  
  // Adjust for severity (higher severity = higher depreciation)
  const severityMultiplier = 1 + (operationSeverity - 1) * 0.05;
  
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
  
  // Add tracking cost if selected
  const trackingCost = hasTracking ? 50 : 0;
  
  return monthlyMaintenanceCost + trackingCost;
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
  const trackingCost = maintenanceParams.hasTracking ? 50 : 0;
  
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
