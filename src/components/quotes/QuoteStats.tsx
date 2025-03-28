
import React from 'react';
import StatsCard from '@/components/ui-custom/StatsCard';

interface QuoteStatsProps {
  totalQuotes: number;
  totalValue: number;
  avgValue: number;
}

const QuoteStats = ({ totalQuotes, totalValue, avgValue }: QuoteStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatsCard 
        title="Total de Orçamentos"
        value={totalQuotes.toString()}
        icon="FileText"
      />
      <StatsCard 
        title="Valor Médio"
        value={`R$ ${avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon="DollarSign"
      />
      <StatsCard 
        title="Valor Total"
        value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon="Wallet"
      />
    </div>
  );
};

export default QuoteStats;
