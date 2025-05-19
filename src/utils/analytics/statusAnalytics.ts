
import { StatusData, ProposalData } from './types';
import { translateStatus } from './translateStatus';

/**
 * Processa dados de status para análises
 */
export function processStatusData(proposals: ProposalData[]): StatusData[] {
  const statusMap: Record<string, number> = {};
  const totalProposals = proposals.length;
  
  proposals.forEach(proposal => {
    const status = proposal.status_flow || 'DESCONHECIDO';
    statusMap[status] = (statusMap[status] || 0) + 1;
  });
  
  return Object.entries(statusMap)
    .map(([status, count]) => ({
      status: translateStatus(status),
      count,
      percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
}
