
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoicDetailedData } from '@/utils/analytics/types';
import { formatCurrency, formatDecimal } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoicDashboardProps {
  data: RoicDetailedData;
  isLoading?: boolean;
}

const RoicDashboard: React.FC<RoicDashboardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>Análise Detalhada de Rentabilidade (ROIC)</span>
          </CardTitle>
          <CardDescription>
            Carregando dados de análise...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando análises de rentabilidade...</div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'ROIC Médio',
      value: `${formatDecimal(data.averageRoic)}%`,
      description: 'Total de propostas'
    },
    {
      title: 'ROIC Mediano',
      value: `${formatDecimal(data.medianRoic)}%`,
      description: 'Valor central'
    },
    {
      title: 'Maior ROIC',
      value: `${formatDecimal(data.highestRoic)}%`,
      description: 'Melhor proposta'
    },
    {
      title: 'Investimento Total',
      value: formatCurrency(data.totalInvestment),
      description: 'Capital investido'
    },
    {
      title: 'Retorno Total',
      value: formatCurrency(data.totalReturn),
      description: 'Receita total'
    },
    {
      title: 'Retorno Líquido',
      value: formatCurrency(data.totalReturn - data.totalInvestment),
      description: 'Lucro estimado'
    }
  ];

  // Preparar dados para o gráfico de barras
  const barChartData = data.proposalsByRoicRange.map((item) => ({
    name: item.range,
    value: item.count,
    percentual: item.percentual
  }));

  // Preparar dados para o gráfico de linha
  const lineChartData = data.monthlyProjection.map((item) => ({
    name: item.monthName,
    roic: parseFloat(item.roic.toFixed(2)),
    investimento: item.investment,
    retorno: item.return
  }));

  const roicLineConfig = {
    roic: {
      label: "ROIC Mensal (%)",
      theme: {
        light: "#2563eb",
        dark: "#3b82f6"
      }
    },
    investimento: {
      label: "Investimento",
      theme: {
        light: "#059669",
        dark: "#10b981"
      }
    },
    retorno: {
      label: "Retorno",
      theme: {
        light: "#d97706",
        dark: "#f59e0b"
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>Análise Detalhada de Rentabilidade (ROIC)</span>
        </CardTitle>
        <CardDescription>
          Análise aprofundada do Retorno sobre o Capital Investido nas propostas
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="bg-muted/40">
              <CardHeader className="pb-2">
                <CardDescription>{stat.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="monthly">
          <TabsList className="mb-6">
            <TabsTrigger value="monthly">Evolução Mensal</TabsTrigger>
            <TabsTrigger value="distribution">Distribuição de ROIC</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly">
            <div className="h-[400px]">
              {lineChartData.length > 0 ? (
                <ChartContainer config={roicLineConfig}>
                  <LineChart 
                    data={lineChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      height={50}
                      tickMargin={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                      width={60}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `R$${value/1000}k`}
                      width={60}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="roic" 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Não há dados suficientes para exibir a evolução mensal do ROIC
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="distribution">
            <div className="h-[400px]">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={barChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      height={50}
                      tickMargin={10}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        return name === 'percentual' 
                          ? [`${parseFloat(value).toFixed(1)}%`, 'Percentual'] 
                          : [value, 'Quantidade'];
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="value" name="Propostas" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Não há dados suficientes para exibir a distribuição de ROIC
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoicDashboard;
