
import { PropositionalAnalytics, ProposalData } from './types';
import { processVehicleData } from './vehiclesAnalytics';
import { processMonthlyData } from './monthlyAnalytics';
import { processStatusData } from './statusAnalytics';
import { processClientData } from './clientAnalytics';
import { processRoicData, processDetailedRoicData } from './roicAnalytics';
import { processKmData } from './kmAnalytics';
import { processContractData } from './contractAnalytics';

/**
 * Processa todos os dados das propostas e gera análises completas
 */
export function processAllAnalytics(proposals: ProposalData[]): PropositionalAnalytics {
  // Total de propostas e valores
  const totalProposals = proposals.length;
  const totalApproved = proposals.filter(p => p.status_flow === 'APROVADA').length;
  const totalRejected = proposals.filter(p => ['REJEITADA', 'CANCELADA'].includes(p.status_flow || '')).length;
  const averageValue = proposals.length > 0 ? 
    proposals.reduce((sum, p) => sum + (p.total_value || 0), 0) / proposals.length : 
    0;
  
  // Processar dados específicos usando as funções de utilidade
  const topVehicles = processVehicleData(proposals);
  const monthlyTotals = processMonthlyData(proposals);
  const statusDistribution = processStatusData(proposals);
  const clientDistribution = processClientData(proposals);
  const roicDistribution = processRoicData(proposals);
  const monthlyKmDistribution = processKmData(proposals);
  const contractDurationDistribution = processContractData(proposals);
  const detailedRoicAnalysis = processDetailedRoicData(proposals);
  
  // Consolidar todos os dados analíticos
  return {
    totalProposals,
    totalApproved,
    totalRejected,
    averageValue,
    topVehicles,
    monthlyTotals,
    statusDistribution,
    clientDistribution,
    roicDistribution,
    monthlyKmDistribution,
    contractDurationDistribution,
    detailedRoicAnalysis
  };
}
