
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface MonthlyData {
  month: string;
  totalValue: number;
  count: number;
}

const MonthlyChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
  // Preparando os dados para o gráfico
  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.month,
      value: item.totalValue,
      count: item.count
    }));
  }, [data]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Volume de Orçamentos por Mês</CardTitle>
        <CardDescription>Análise de valores e quantidade mensais</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Dados insuficientes para gerar o gráfico
          </div>
        ) : (
          <ChartContainer
            config={{
              area: {
                theme: {
                  light: '#7C3AED', // Primary color
                  dark: '#8B5CF6',
                },
              },
              grid: {
                theme: {
                  light: '#E4E4E7',
                  dark: '#27272A',
                },
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 10,
                }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} 
                  className="text-xs"
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Valor Total"
                  stroke="#7C3AED"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          Quantidade: <span className="font-medium">{payload[0].payload.count}</span>
        </p>
        <p className="text-sm text-primary font-medium">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }

  return null;
};

export default MonthlyChart;
