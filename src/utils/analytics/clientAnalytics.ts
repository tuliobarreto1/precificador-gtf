
import { ClientData, ProposalData } from './types';

/**
 * Processa dados de clientes para análises
 */
export function processClientData(proposals: ProposalData[]): ClientData[] {
  const clientMap: Record<string, { count: number, totalValue: number }> = {};
  
  proposals.forEach(proposal => {
    const clientName = proposal.clients?.name || 'Cliente não identificado';
    if (!clientMap[clientName]) {
      clientMap[clientName] = { count: 0, totalValue: 0 };
    }
    
    clientMap[clientName].count += 1;
    clientMap[clientName].totalValue += (proposal.total_value || 0);
  });
  
  return Object.entries(clientMap)
    .map(([client, { count, totalValue }]) => ({
      client,
      count,
      totalValue
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
