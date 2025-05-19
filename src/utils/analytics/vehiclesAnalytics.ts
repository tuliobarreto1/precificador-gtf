
import { VehicleData, ProposalData } from './types';

/**
 * Processa dados de veículos para análises
 */
export function processVehicleData(proposals: ProposalData[]): VehicleData[] {
  const vehicleCountMap: Record<string, number> = {};
  let totalVehicles = 0;
  
  proposals.forEach(proposal => {
    const vehicles = proposal.quote_vehicles || [];
    vehicles.forEach((vehicle: any) => {
      if (vehicle?.vehicles) {
        const modelName = `${vehicle.vehicles.brand} ${vehicle.vehicles.model}`;
        vehicleCountMap[modelName] = (vehicleCountMap[modelName] || 0) + 1;
        totalVehicles++;
      }
    });
  });
  
  return Object.entries(vehicleCountMap)
    .map(([model, count]) => ({
      model,
      count,
      percentual: totalVehicles > 0 ? (count / totalVehicles) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
