
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';

interface ClientData {
  client: string;
  count: number;
  totalValue: number;
}

const ClientDistributionTable: React.FC<{ data: ClientData[] }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Não há dados de clientes disponíveis
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Orçamentos</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Média por Orçamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((client, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{client.client}</TableCell>
                  <TableCell className="text-right">{client.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(client.totalValue)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(client.totalValue / client.count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientDistributionTable;
