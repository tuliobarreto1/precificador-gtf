
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import StatCards from '@/components/analytics/StatCards';
import MonthlyChart from '@/components/analytics/MonthlyChart';
import StatusDistributionChart from '@/components/analytics/StatusDistributionChart';
import TopVehiclesChart from '@/components/analytics/TopVehiclesChart';
import ClientDistributionTable from '@/components/analytics/ClientDistributionTable';
import ContractMetricsChart from '@/components/analytics/ContractMetricsChart';
import DateRangeSelector from '@/components/analytics/DateRangeSelector';
import RoicDashboard from '@/components/analytics/RoicDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Resultados: React.FC = () => {
  const { 
    loading, 
    analytics, 
    error, 
    dateRange,
    setDateRange,
    refreshAnalytics
  } = useAnalytics();
  
  const handleRefresh = () => {
    refreshAnalytics();
  };

  return (
    <MainLayout>
      <PageTitle
        title="Resultados"
        subtitle="Dashboards e análises de desempenho de propostas"
        breadcrumbs={[
          { label: "Home", url: "/" },
          { label: "Resultados", url: "/resultados" }
        ]}
      />
      
      <div className="flex justify-end mb-6">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar dados
        </Button>
      </div>
      
      <DateRangeSelector 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        className="mb-6"
      />
      
      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-8">
          <p className="font-semibold">Erro ao carregar dados:</p>
          <p>{error}</p>
        </div>
      ) : null}
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="roic">Análise de Rentabilidade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <StatCards
            totalProposals={analytics?.totalProposals || 0}
            totalApproved={analytics?.totalApproved || 0}
            totalRejected={analytics?.totalRejected || 0}
            averageValue={analytics?.averageValue || 0}
            isLoading={loading}
          />
          
          <MonthlyChart 
            data={analytics?.monthlyTotals || []}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <StatusDistributionChart 
              data={analytics?.statusDistribution || []}
            />
            <TopVehiclesChart 
              data={analytics?.topVehicles || []}
            />
          </div>
          
          <div className="mt-8">
            <ClientDistributionTable 
              data={analytics?.clientDistribution || []}
            />
          </div>
          
          <div className="mt-8 pb-10">
            <ContractMetricsChart 
              contractData={analytics?.contractDurationDistribution || []}
              kmData={analytics?.monthlyKmDistribution || []}
              roicData={analytics?.roicDistribution || []}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="roic" className="space-y-8">
          <RoicDashboard 
            data={analytics?.detailedRoicAnalysis || {
              averageRoic: 0,
              medianRoic: 0,
              highestRoic: 0,
              lowestRoic: 0,
              totalInvestment: 0,
              totalReturn: 0,
              proposalsByRoicRange: [],
              monthlyProjection: []
            }}
            isLoading={loading}
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Resultados;
