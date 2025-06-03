
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { SavedQuote } from '@/context/types/quoteTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContractDetailsCardProps {
  quote: SavedQuote;
}

const ContractDetailsCard: React.FC<ContractDetailsCardProps> = ({ quote }) => {
  const contractMonths = quote.contractMonths || quote.globalParams?.contractMonths || 24;
  const monthlyKm = quote.monthlyKm || quote.globalParams?.monthlyKm || 3000;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Contrato</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Prazo:</span>
          <span className="font-medium">{contractMonths} meses</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Quilometragem:</span>
          <span className="font-medium">{monthlyKm.toLocaleString('pt-BR')} km/mês</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Valor Total:</span>
          <span className="font-medium">{formatCurrency(quote.totalValue * contractMonths)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Valor Mensal:</span>
          <span className="font-medium">{formatCurrency(quote.totalValue)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractDetailsCard;
