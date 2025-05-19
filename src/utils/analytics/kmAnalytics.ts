
import { KmData, ProposalData } from './types';

/**
 * Processa dados de quilometragem mensal para análises
 */
export function processKmData(proposals: ProposalData[]): KmData[] {
  const kmRanges = [
    { min: 0, max: 1500, label: 'Até 1.500 km' },
    { min: 1501, max: 3000, label: '1.501-3.000 km' },
    { min: 3001, max: 5000, label: '3.001-5.000 km' },
    { min: 5001, max: 10000, label: '5.001-10.000 km' },
    { min: 10001, max: Infinity, label: 'Acima de 10.000 km' }
  ];
  
  const kmMap: Record<string, number> = {};
  kmRanges.forEach(range => { kmMap[range.label] = 0 });
  
  const totalProposals = proposals.length;
  
  proposals.forEach(proposal => {
    const km = proposal.monthly_km || 0;
    const range = kmRanges.find(r => km >= r.min && km < r.max);
    if (range) {
      kmMap[range.label] = (kmMap[range.label] || 0) + 1;
    }
  });
  
  return Object.entries(kmMap)
    .map(([range, count]) => ({
      range,
      count,
      percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
    }))
    .filter(item => item.count > 0);
}
