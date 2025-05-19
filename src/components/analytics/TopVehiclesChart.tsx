
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VehicleData {
  model: string;
  count: number;
  percentual: number;
}

const TopVehiclesChart: React.FC<{ data: VehicleData[] }> = ({ data }) => {
  // Preparando os dados para o gráfico de barras
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      name: item.model.length > 15 ? `${item.model.substring(0, 15)}...` : item.model,
      fullName: item.model,
      Quantidade: item.count,
      Percentual: item.percentual.toFixed(1)
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Veículos Mais Cotados</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Dados insuficientes para gerar o gráfico
          </div>
        ) : (
          <ChartContainer
            config={{
              bar: {
                theme: {
                  light: '#7C3AED',
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
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    return [value, props.payload.fullName];
                  }}
                />
                <Legend />
                <Bar dataKey="Quantidade" fill="#7C3AED" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TopVehiclesChart;
