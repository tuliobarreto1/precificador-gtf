
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StatusData {
  status: string;
  count: number;
  percentual: number;
}

const COLORS = ['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

const StatusDistributionChart: React.FC<{ data: StatusData[] }> = ({ data }) => {
  // Formatando dados para o gráfico
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      name: item.status,
      value: item.count,
      percentual: item.percentual.toFixed(1)
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Status</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Dados insuficientes para gerar o gráfico
          </div>
        ) : (
          <ChartContainer
            config={{
              pie: {
                theme: {
                  light: '#7C3AED',
                  dark: '#8B5CF6',
                },
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    return [`${value} (${props.payload.percentual}%)`, name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
