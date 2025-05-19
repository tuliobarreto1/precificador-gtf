
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

export type ProposalData = any; // Tipo mais específico pode ser definido conforme a estrutura real dos dados
export type DateRangeType = { start: Date | null, end: Date | null };
