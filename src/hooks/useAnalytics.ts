
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PropositionalAnalytics, DateRangeType } from '@/utils/analytics/types';
import { processAllAnalytics } from '@/utils/analytics/processAnalytics';

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PropositionalAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeType>({
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
      
      // Processar os dados para as análises usando o utilitário centralizado
      const proposals = quotesData || [];
      const analyticsData = processAllAnalytics(proposals);
      setAnalytics(analyticsData);
      
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
  
  return {
    loading,
    analytics,
    error,
    dateRange,
    setDateRange,
    refreshAnalytics
  };
}
