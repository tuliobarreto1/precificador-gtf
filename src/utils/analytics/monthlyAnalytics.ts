
import { MonthlyData, ProposalData } from './types';

/**
 * Processa dados mensais para análise de tendências
 */
export function processMonthlyData(proposals: ProposalData[]): MonthlyData[] {
  interface MonthDataTemp {
    totalValue: number;
    count: number;
    monthName: string;
  }
  
  const monthlyMap: Record<string, MonthDataTemp> = {};
  
  proposals.forEach(proposal => {
    const date = new Date(proposal.created_at);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { totalValue: 0, count: 0, monthName };
    }
    
    monthlyMap[monthKey].totalValue += (proposal.total_value || 0);
    monthlyMap[monthKey].count += 1;
  });
  
  return Object.entries(monthlyMap)
    .map(([key, { totalValue, count, monthName }]) => ({
      month: monthName || key,
      totalValue,
      count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
