
import { ContractData, ProposalData } from './types';

/**
 * Processa dados de duração de contrato para análises
 */
export function processContractData(proposals: ProposalData[]): ContractData[] {
  const contractMap: Record<number, number> = {};
  const totalProposals = proposals.length;
  
  proposals.forEach(proposal => {
    const months = proposal.contract_months || 0;
    contractMap[months] = (contractMap[months] || 0) + 1;
  });
  
  return Object.entries(contractMap)
    .map(([months, count]) => ({
      months: parseInt(months),
      count,
      percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
    }))
    .sort((a, b) => a.months - b.months)
    .filter(item => item.months > 0);
}
