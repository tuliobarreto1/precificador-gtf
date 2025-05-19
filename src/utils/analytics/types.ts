
export interface PropositionalAnalytics {
  totalProposals: number;
  totalApproved: number;
  totalRejected: number;
  averageValue: number;
  topVehicles: VehicleData[];
  monthlyTotals: MonthlyData[];
  statusDistribution: StatusData[];
  clientDistribution: ClientData[];
  roicDistribution: RoicData[];
  monthlyKmDistribution: KmData[];
  contractDurationDistribution: ContractData[];
  detailedRoicAnalysis: RoicDetailedData;
}

export interface VehicleData {
  model: string;
  count: number;
  percentual: number;
}

export interface MonthlyData {
  month: string;
  totalValue: number;
  count: number;
}

export interface StatusData {
  status: string;
  count: number;
  percentual: number;
}

export interface ClientData {
  client: string;
  count: number;
  totalValue: number;
}

export interface RoicData {
  range: string;
  count: number;
  percentual: number;
}

export interface KmData {
  range: string;
  count: number;
  percentual: number;
}

export interface ContractData {
  months: number;
  count: number;
  percentual: number;
}

export interface RoicDetailedData {
  averageRoic: number;
  medianRoic: number;
  highestRoic: number;
  lowestRoic: number;
  totalInvestment: number;
  totalReturn: number;
  proposalsByRoicRange: RoicData[];
  monthlyProjection: RoicMonthlyProjection[];
}

export interface RoicMonthlyProjection {
  month: string;
  monthName: string;
  investment: number;
  return: number;
  roic: number;
}

export type ProposalData = any; // Tipo mais específico pode ser definido conforme a estrutura real dos dados
export type DateRangeType = { start: Date | null, end: Date | null };
