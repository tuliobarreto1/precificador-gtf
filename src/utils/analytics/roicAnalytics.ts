
import { RoicData, ProposalData, RoicDetailedData } from './types';

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

/**
 * Processa dados detalhados de ROIC para análises avançadas
 */
export function processDetailedRoicData(proposals: ProposalData[]): RoicDetailedData {
  // Inicialização de valores padrão para caso de nenhuma proposta
  if (!proposals || proposals.length === 0) {
    return {
      averageRoic: 0,
      medianRoic: 0,
      highestRoic: 0,
      lowestRoic: 0,
      totalInvestment: 0,
      totalReturn: 0,
      proposalsByRoicRange: [],
      monthlyProjection: []
    };
  }
  
  // Propostas válidas - apenas aquelas que têm veículos e valores
  const validProposals = proposals.filter(p => 
    (p?.quote_vehicles?.length > 0) && 
    (p?.total_value > 0)
  );
  
  // Segundo nível de verificação após o filtro
  if (validProposals.length === 0) {
    return {
      averageRoic: 0,
      medianRoic: 0,
      highestRoic: 0,
      lowestRoic: 0,
      totalInvestment: 0,
      totalReturn: 0,
      proposalsByRoicRange: [],
      monthlyProjection: []
    };
  }
  
  // Calcular ROIC para cada proposta
  const proposalsWithRoic = validProposals.map(proposal => {
    const totalValue = proposal.total_value || 0;
    const vehicles = proposal.quote_vehicles || [];
    let vehicleValue = 0;
    
    vehicles.forEach((v: any) => {
      // Usar valor do próprio veículo ou um valor padrão
      const vValue = (v?.vehicles?.value || 0);
      vehicleValue += vValue;
    });
    
    // Garantir que o valor do veículo não seja zero
    vehicleValue = vehicleValue || 1; // Evita divisão por zero
    
    const monthlyValue = vehicles.reduce((sum: number, v: any) => sum + (v.monthly_value || 0), 0);
    const contractMonths = proposal.contract_months || 24;
    
    // Valor estimado de venda após contrato (depreciação)
    const estimatedEndValue = vehicleValue * 0.6; // 40% de depreciação após o período
    
    // Retorno total = mensal * meses + valor residual
    const totalReturn = (monthlyValue * contractMonths) + estimatedEndValue;
    
    // Investimento inicial = valor dos veículos
    const initialInvestment = vehicleValue;
    
    // ROIC = (Retorno - Investimento) / Investimento * 100
    const roic = initialInvestment > 0 
      ? ((totalReturn - initialInvestment) / initialInvestment) * 100 
      : 0;
    
    // ROIC mensal
    const monthlyRoic = contractMonths > 0 ? roic / contractMonths : 0;
    
    return {
      id: proposal.id,
      title: proposal.title || `Proposta ${proposal.id}`,
      clientName: proposal.clients?.name || 'Cliente não identificado',
      contractMonths,
      initialInvestment,
      totalReturn,
      roic,
      monthlyRoic,
      createdAt: proposal.created_at
    };
  });
  
  // Ordenar por ROIC (descendente)
  const sortedProposals = [...proposalsWithRoic].sort((a, b) => b.roic - a.roic);
  
  // Calcular estatísticas
  const roicValues = sortedProposals.map(p => p.roic).filter(r => !isNaN(r) && isFinite(r));
  const averageRoic = roicValues.length > 0 
    ? roicValues.reduce((sum, r) => sum + r, 0) / roicValues.length 
    : 0;
  
  // Mediana
  const sortedRoic = [...roicValues].sort((a, b) => a - b);
  const medianRoic = sortedRoic.length > 0 
    ? (sortedRoic.length % 2 === 0
      ? (sortedRoic[sortedRoic.length / 2 - 1] + sortedRoic[sortedRoic.length / 2]) / 2
      : sortedRoic[Math.floor(sortedRoic.length / 2)])
    : 0;
  
  // Valor máximo e mínimo
  const highestRoic = roicValues.length > 0 ? Math.max(...roicValues) : 0;
  const lowestRoic = roicValues.length > 0 ? Math.min(...roicValues) : 0;
  
  // Investimento total e retorno total
  const totalInvestment = sortedProposals.reduce((sum, p) => sum + p.initialInvestment, 0);
  const totalReturn = sortedProposals.reduce((sum, p) => sum + p.totalReturn, 0);
  
  // Distribuição por faixa de ROIC
  const roicRanges = [
    { min: 0, max: 10, label: '0-10%' },
    { min: 10, max: 20, label: '10-20%' },
    { min: 20, max: 30, label: '20-30%' },
    { min: 30, max: 40, label: '30-40%' },
    { min: 40, max: 50, label: '40-50%' },
    { min: 50, max: Infinity, label: '50%+' }
  ];
  
  const proposalsByRange = roicRanges.map(range => {
    const count = sortedProposals.filter(p => p.roic >= range.min && p.roic < range.max).length;
    return {
      range: range.label,
      count,
      percentual: sortedProposals.length > 0 ? (count / sortedProposals.length) * 100 : 0
    };
  }).filter(item => item.count > 0);
  
  // Projeção mensal de retorno (considerando últimos 12 meses)
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  
  // Agrupar por mês
  const monthlyData: Record<string, { investment: number, return: number }> = {};
  
  sortedProposals.forEach(proposal => {
    if (!proposal.createdAt) return;
    
    const createdDate = new Date(proposal.createdAt);
    if (createdDate < lastYear) return;
    
    const monthYear = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { investment: 0, return: 0 };
    }
    
    monthlyData[monthYear].investment += proposal.initialInvestment;
    monthlyData[monthYear].return += proposal.totalReturn;
  });
  
  // Converter para array
  const monthlyProjection = Object.entries(monthlyData).map(([month, data]) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    const monthlyRoic = data.investment > 0 
      ? ((data.return - data.investment) / data.investment) * 100 
      : 0;
      
    return {
      month,
      monthName,
      investment: data.investment,
      return: data.return,
      roic: monthlyRoic
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    averageRoic,
    medianRoic,
    highestRoic,
    lowestRoic,
    totalInvestment,
    totalReturn,
    proposalsByRoicRange: proposalsByRange || [],
    monthlyProjection: monthlyProjection || []
  };
}
