
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Database, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StatCardsProps {
  totalProposals: number;
  totalApproved: number;
  totalRejected: number;
  averageValue: number;
  isLoading?: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({
  totalProposals,
  totalApproved,
  totalRejected,
  averageValue,
  isLoading = false
}) => {
  const approvalRate = totalProposals > 0 ? (totalApproved / totalProposals) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total de Propostas</p>
            {isLoading ? (
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">{totalProposals}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Valor Médio</p>
            {isLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(averageValue)}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</p>
            {isLoading ? (
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="flex items-center">
                <p className="text-2xl font-bold">{approvalRate.toFixed(1)}%</p>
                <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{totalApproved} aprovadas</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Taxa de Rejeição</p>
            {isLoading ? (
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {totalProposals > 0 ? ((totalRejected / totalProposals) * 100).toFixed(1) : '0.0'}%
                </p>
                <XCircle className="w-4 h-4 ml-2 text-red-500" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{totalRejected} rejeitadas</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
