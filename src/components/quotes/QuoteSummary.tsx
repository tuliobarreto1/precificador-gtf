
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { QuoteVehicleResult } from '@/context/types/quoteTypes';

interface QuoteSummaryProps {
  vehicleResults: QuoteVehicleResult[];
  totalCost: number;
}

const QuoteSummary: React.FC<QuoteSummaryProps> = ({ vehicleResults, totalCost }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Resumo do Orçamento</h3>
      
      <div className="space-y-2">
        {vehicleResults.map((result, index) => (
          <div key={result.vehicleId} className="flex justify-between items-center p-2 border rounded">
            <span>Veículo {index + 1}</span>
            <span className="font-medium">{formatCurrency(result.totalCost)}</span>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-2">
        <div className="flex justify-between items-center font-semibold text-lg">
          <span>Total Mensal:</span>
          <span>{formatCurrency(totalCost)}</span>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummary;
