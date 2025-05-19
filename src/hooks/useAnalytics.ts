
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PropositionalAnalytics {
  totalProposals: number;
  totalApproved: number;
  totalRejected: number;
  averageValue: number;
  topVehicles: {
    model: string;
    count: number;
    percentual: number;
  }[];
  monthlyTotals: {
    month: string;
    totalValue: number;
    count: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    percentual: number;
  }[];
  clientDistribution: {
    client: string;
    count: number;
    totalValue: number;
  }[];
  roicDistribution: {
    range: string;
    count: number;
    percentual: number;
  }[];
  monthlyKmDistribution: {
    range: string;
    count: number;
    percentual: number;
  }[];
  contractDurationDistribution: {
    months: number;
    count: number;
    percentual: number;
  }[];
}

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PropositionalAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1), // Últimos 3 meses
    end: new Date()
  });
  
  const { toast } = useToast();
  
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar todas as propostas
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          client_id,
          total_value,
          created_at,
          status,
          status_flow,
          contract_months,
          monthly_km,
          clients (
            id,
            name
          ),
          quote_vehicles (
            *,
            vehicles (
              brand,
              model
            )
          )
        `)
        .gte('created_at', dateRange.start ? dateRange.start.toISOString() : null)
        .lte('created_at', dateRange.end ? dateRange.end.toISOString() : null)
        .order('created_at', { ascending: false });
      
      if (quotesError) {
        console.error('Erro ao buscar orçamentos para análise:', quotesError);
        setError('Erro ao buscar dados para análise');
        toast({
          title: "Erro ao carregar dados",
          description: quotesError.message,
          variant: "destructive"
        });
        return;
      }
      
      // Processar os dados para as análises
      const proposals = quotesData || [];
      
      // Total de propostas e valores
      const totalProposals = proposals.length;
      const totalApproved = proposals.filter(p => p.status_flow === 'APROVADA').length;
      const totalRejected = proposals.filter(p => ['REJEITADA', 'CANCELADA'].includes(p.status_flow || '')).length;
      const averageValue = proposals.length > 0 ? 
        proposals.reduce((sum, p) => sum + (p.total_value || 0), 0) / proposals.length : 
        0;
      
      // Top veículos
      const vehicleCountMap: Record<string, number> = {};
      let totalVehicles = 0;
      
      proposals.forEach(proposal => {
        const vehicles = proposal.quote_vehicles || [];
        vehicles.forEach(vehicle => {
          if (vehicle?.vehicles) {
            const modelName = `${vehicle.vehicles.brand} ${vehicle.vehicles.model}`;
            vehicleCountMap[modelName] = (vehicleCountMap[modelName] || 0) + 1;
            totalVehicles++;
          }
        });
      });
      
      const topVehicles = Object.entries(vehicleCountMap)
        .map(([model, count]) => ({
          model,
          count,
          percentual: totalVehicles > 0 ? (count / totalVehicles) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Totais mensais
      const monthlyMap: Record<string, { totalValue: number, count: number }> = {};
      
      proposals.forEach(proposal => {
        const date = new Date(proposal.created_at);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { totalValue: 0, count: 0, monthName };
        }
        
        monthlyMap[monthKey].totalValue += (proposal.total_value || 0);
        monthlyMap[monthKey].count += 1;
      });
      
      const monthlyTotals = Object.entries(monthlyMap)
        .map(([key, { totalValue, count, monthName }]) => ({
          month: monthName || key,
          totalValue,
          count
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Distribuição por status
      const statusMap: Record<string, number> = {};
      
      proposals.forEach(proposal => {
        const status = proposal.status_flow || 'DESCONHECIDO';
        statusMap[status] = (statusMap[status] || 0) + 1;
      });
      
      const statusDistribution = Object.entries(statusMap)
        .map(([status, count]) => ({
          status: translateStatus(status),
          count,
          percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);
      
      // Distribuição por cliente
      const clientMap: Record<string, { count: number, totalValue: number }> = {};
      
      proposals.forEach(proposal => {
        const clientName = proposal.clients?.name || 'Cliente não identificado';
        if (!clientMap[clientName]) {
          clientMap[clientName] = { count: 0, totalValue: 0 };
        }
        
        clientMap[clientName].count += 1;
        clientMap[clientName].totalValue += (proposal.total_value || 0);
      });
      
      const clientDistribution = Object.entries(clientMap)
        .map(([client, { count, totalValue }]) => ({
          client,
          count,
          totalValue
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Distribuição por ROIC (estimada)
      const roicRanges = [
        { min: 0, max: 1, label: '0-1%' },
        { min: 1, max: 2, label: '1-2%' },
        { min: 2, max: 3, label: '2-3%' },
        { min: 3, max: 5, label: '3-5%' },
        { min: 5, max: 10, label: '5-10%' },
        { min: 10, max: Infinity, label: '10%+' }
      ];
      
      const roicMap: Record<string, number> = {};
      roicRanges.forEach(range => { roicMap[range.label] = 0 });
      
      // Simulação de ROIC baseada nos valores dos veículos e orçamentos
      proposals.forEach(proposal => {
        // Calculando um ROIC estimado baseado no valor total vs. valor dos veículos
        // Isso é uma aproximação simples para fins de demonstração
        const totalValue = proposal.total_value || 0;
        const vehicles = proposal.quote_vehicles || [];
        let vehicleValue = 0;
        
        vehicles.forEach(v => {
          vehicleValue += v.monthly_value || 0;
        });
        
        // ROIC estimado (valor simplesmente ilustrativo)
        const estimatedRoic = vehicleValue > 0 
          ? ((totalValue / vehicleValue - 1) * 100) 
          : 0;
        
        // Encontrar o range correspondente
        const range = roicRanges.find(r => estimatedRoic >= r.min && estimatedRoic < r.max);
        if (range) {
          roicMap[range.label] = (roicMap[range.label] || 0) + 1;
        }
      });
      
      const roicDistribution = Object.entries(roicMap)
        .map(([range, count]) => ({
          range,
          count,
          percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
        }))
        .filter(item => item.count > 0);
      
      // Distribuição por KM mensal
      const kmRanges = [
        { min: 0, max: 1500, label: 'Até 1.500 km' },
        { min: 1501, max: 3000, label: '1.501-3.000 km' },
        { min: 3001, max: 5000, label: '3.001-5.000 km' },
        { min: 5001, max: 10000, label: '5.001-10.000 km' },
        { min: 10001, max: Infinity, label: 'Acima de 10.000 km' }
      ];
      
      const kmMap: Record<string, number> = {};
      kmRanges.forEach(range => { kmMap[range.label] = 0 });
      
      proposals.forEach(proposal => {
        const km = proposal.monthly_km || 0;
        const range = kmRanges.find(r => km >= r.min && km < r.max);
        if (range) {
          kmMap[range.label] = (kmMap[range.label] || 0) + 1;
        }
      });
      
      const monthlyKmDistribution = Object.entries(kmMap)
        .map(([range, count]) => ({
          range,
          count,
          percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
        }))
        .filter(item => item.count > 0);
      
      // Distribuição por duração do contrato
      const contractMap: Record<number, number> = {};
      
      proposals.forEach(proposal => {
        const months = proposal.contract_months || 0;
        contractMap[months] = (contractMap[months] || 0) + 1;
      });
      
      const contractDurationDistribution = Object.entries(contractMap)
        .map(([months, count]) => ({
          months: parseInt(months),
          count,
          percentual: totalProposals > 0 ? (count / totalProposals) * 100 : 0
        }))
        .sort((a, b) => a.months - b.months)
        .filter(item => item.months > 0);
      
      // Consolidar todos os dados analíticos
      setAnalytics({
        totalProposals,
        totalApproved,
        totalRejected,
        averageValue,
        topVehicles,
        monthlyTotals,
        statusDistribution,
        clientDistribution,
        roicDistribution,
        monthlyKmDistribution,
        contractDurationDistribution
      });
      
    } catch (err) {
      console.error('Erro ao gerar análises:', err);
      setError('Erro ao processar dados analíticos');
      toast({
        title: "Erro na análise de dados",
        description: "Houve um problema ao processar os dados para análise",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);
  
  const refreshAnalytics = () => {
    fetchAnalytics();
  };
  
  // Função para converter status em português
  function translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ORCAMENTO': 'Orçamento',
      'PROPOSTA_GERADA': 'Proposta Gerada',
      'EM_VERIFICACAO': 'Em Verificação',
      'APROVADA': 'Aprovada',
      'REJEITADA': 'Rejeitada',
      'CANCELADA': 'Cancelada'
    };
    
    return statusMap[status] || status;
  }
  
  return {
    loading,
    analytics,
    error,
    dateRange,
    setDateRange,
    refreshAnalytics
  };
}
