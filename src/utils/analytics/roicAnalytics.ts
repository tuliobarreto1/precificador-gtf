
import { RoicData, ProposalData } from './types';

/**
 * Processa dados de ROIC para análises
 */
export function processRoicData(proposals: ProposalData[]): RoicData[] {
  const roicRanges = [
    { min: 0, max: 1, label: '0-1%' },
    { min: 1, max: 2, label: '1-2%' },
    { min: 2, max: 3, label: '2-3%' },
    { min: 3, max: 5, label: '3-5%' },
    { min: 5, max: 10, label: '5-10%' },
    { min: 10, max: Infinity, label: '10%+' }
  ];
  
  const roicMap: Record<string, number> = {};
  roicRanges.forEach(range => { roicMap[range.label] = 0 });
  
  const totalProposals = proposals.length;
  
  // Simulação de ROIC baseada nos valores dos veículos e orçamentos
  proposals.forEach(proposal => {
    const totalValue = proposal.total_value || 0;
    const vehicles = proposal.quote_vehicles || [];
    let vehicleValue = 0;
    
    vehicles.forEach((v: any) => {
      vehicleValue += v.monthly_value || 0;
    });
    
    // ROIC estimado (valor simplesmente ilustrativo)
    const estimatedRoic = vehicleValue > 0 
      ? ((totalValue / vehicleValue - 1) * 100) 
      : 0;
    
    // Encontrar o range correspondente
    const range = roicRanges.find(r => estimatedRoic >= r.min && estimatedRoic < r.max);
    if (range) {
      roicMap[range.label] = (roicMap[range.label] || 0) + 1;
    }
  });
  
  return Object.entries(roicMap)
    .map(([range, count]) => ({
      range,
      count,
      percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
    }))
    .filter(item => item.count > 0);
}
