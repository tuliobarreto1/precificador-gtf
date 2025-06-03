
import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SavedQuote } from '@/context/types/quoteTypes';
import { Button } from '@/components/ui/button';

interface QuoteTableProps {
  quotes: SavedQuote[];
  onViewQuote: (quote: SavedQuote) => void;
  onEditQuote: (quote: SavedQuote) => void;
  onDeleteQuote: (quote: SavedQuote) => void;
}

const QuoteTable: React.FC<QuoteTableProps> = ({ 
  quotes, 
  onViewQuote, 
  onEditQuote, 
  onDeleteQuote 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Cliente</th>
            <th className="border p-2 text-left">Veículos</th>
            <th className="border p-2 text-left">Valor Total</th>
            <th className="border p-2 text-left">Data</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td className="border p-2">{quote.clientName}</td>
              <td className="border p-2">{quote.vehicles?.length || 0}</td>
              <td className="border p-2">{formatCurrency(quote.totalValue)}</td>
              <td className="border p-2">{formatDate(quote.createdAt)}</td>
              <td className="border p-2">{quote.status}</td>
              <td className="border p-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onViewQuote(quote)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEditQuote(quote)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteQuote(quote)}>
                    Excluir
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuoteTable;
