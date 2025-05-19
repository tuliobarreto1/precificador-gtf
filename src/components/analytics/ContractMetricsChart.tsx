
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ContractDistribution {
  months: number;
  count: number;
  percentual: number;
}

interface KmDistribution {
  range: string;
  count: number;
  percentual: number;
}

interface RoicDistribution {
  range: string;
  count: number;
  percentual: number;
}

interface ContractMetricsChartProps {
  contractData: ContractDistribution[];
  kmData: KmDistribution[];
  roicData: RoicDistribution[];
}

const COLORS = ['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF'];

const ContractMetricsChart: React.FC<ContractMetricsChartProps> = ({ 
  contractData, 
  kmData, 
  roicData 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Contratos</CardTitle>
        <CardDescription>Análise de prazos, quilometragem e rentabilidade</CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <Tabs defaultValue="duration">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="duration" className="flex-1">Duração</TabsTrigger>
            <TabsTrigger value="km" className="flex-1">Quilometragem</TabsTrigger>
            <TabsTrigger value="roic" className="flex-1">Rentabilidade</TabsTrigger>
          </TabsList>
          
          <TabsContent value="duration" className="h-[300px]">
            {contractData.length === 0 ? (
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
                      data={contractData.map(item => ({
                        name: `${item.months} meses`,
                        value: item.count,
                        percentual: item.percentual.toFixed(1)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {contractData.map((entry, index) => (
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
          </TabsContent>
          
          <TabsContent value="km" className="h-[300px]">
            {kmData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Dados insuficientes para gerar o gráfico
              </div>
            ) : (
              <ChartContainer
                config={{
                  pie: {
                    theme: {
                      light: '#6D28D9',
                      dark: '#8B5CF6',
                    },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kmData.map(item => ({
                        name: item.range,
                        value: item.count,
                        percentual: item.percentual.toFixed(1)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {kmData.map((entry, index) => (
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
          </TabsContent>
          
          <TabsContent value="roic" className="h-[300px]">
            {roicData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Dados insuficientes para gerar o gráfico
              </div>
            ) : (
              <ChartContainer
                config={{
                  pie: {
                    theme: {
                      light: '#8B5CF6',
                      dark: '#9333EA',
                    },
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roicData.map(item => ({
                        name: item.range,
                        value: item.count,
                        percentual: item.percentual.toFixed(1)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {roicData.map((entry, index) => (
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContractMetricsChart;
