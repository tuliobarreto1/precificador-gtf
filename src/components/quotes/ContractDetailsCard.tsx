
import React from 'react';
import { SavedQuote } from '@/context/types/quoteTypes';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/status/StatusBadge';
import { QuoteStatusFlow } from '@/lib/status-flow';

interface ContractDetailsCardProps {
  quote: SavedQuote;
}

const ContractDetailsCard: React.FC<ContractDetailsCardProps> = ({ quote }) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader title="Dados do Contrato" />
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium">Valor Total</h3>
          <p className="text-2xl font-bold">{formatCurrency(quote.totalValue)} <span className="text-sm font-normal">/ mês</span></p>
          {quote.contractMonths && (
            <p className="text-sm text-muted-foreground">
              Contrato de {quote.contractMonths} meses - 
              Total: {formatCurrency(quote.totalValue * quote.contractMonths)}
            </p>
          )}
        </div>
        
        <div>
          <h3 className="font-medium">Detalhes</h3>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={quote.status as QuoteStatusFlow || 'draft'} />
            </div>
            {quote.globalParams && (
              <>
                <p>Km mensal: {quote.globalParams.monthlyKm} km</p>
                <p>Severidade: {quote.globalParams.operationSeverity}</p>
                <p>Rastreamento: {quote.globalParams.hasTracking ? 'Sim' : 'Não'}</p>
                <p>IPVA: {quote.globalParams.includeIpva ? 'Incluído' : 'Não incluído'}</p>
                <p>Licenciamento: {quote.globalParams.includeLicensing ? 'Incluído' : 'Não incluído'}</p>
                <p>Custos financeiros: {quote.globalParams.includeTaxes ? 'Incluídos' : 'Não incluídos'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContractDetailsCard;
