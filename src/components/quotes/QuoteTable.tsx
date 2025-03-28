
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/status/StatusBadge';
import { QuoteStatusFlow } from '@/lib/status-flow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName: string;
  value: number;
  createdAt: string;
  status: string;
  source: 'demo' | 'local' | 'supabase';
}

interface QuoteTableProps {
  quotes: QuoteItem[];
}

const QuoteTable = ({ quotes }: QuoteTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={`${quote.source}-${quote.id}`}>
              <TableCell>
                <Link to={`/orcamento/${quote.id}`}>
                  <span className="font-medium hover:text-primary">
                    {quote.clientName || "Cliente não especificado"}
                  </span>
                </Link>
              </TableCell>
              <TableCell>{quote.vehicleName || "Veículo não especificado"}</TableCell>
              <TableCell>
                R$ {Number(quote.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <StatusBadge status={quote.status as QuoteStatusFlow} size="sm" />
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  quote.source === 'supabase' ? 'bg-blue-50 text-blue-700' : 
                  quote.source === 'local' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  {quote.source === 'supabase' ? 'Supabase' : 
                   quote.source === 'local' ? 'Local' : 'Demo'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/orcamento/${quote.id}`}>
                  <Button variant="link" size="sm">Ver detalhes</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuoteTable;
