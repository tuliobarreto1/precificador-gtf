
import { useState, useEffect } from 'react';
import { useQuote } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { quotes, getClientById, getVehicleById } from '@/lib/mock-data';
import { checkSupabaseConnection, getQuotesFromSupabase } from '@/integrations/supabase/client';

interface QuoteItem {
  id: string;
  clientName: string;
  vehicleName: string;
  value: number;
  createdAt: string;
  status: string;
  source: 'demo' | 'local' | 'supabase';
}

export const useQuotes = () => {
  const [loading, setLoading] = useState(false);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseQuotes, setSupabaseQuotes] = useState<any[]>([]);
  
  const { savedQuotes } = useQuote();
  const { toast } = useToast();

  // Verificar conexão com o Supabase e carregar orçamentos
  useEffect(() => {
    console.log('Hook useQuotes montado, verificando conexão e carregando orçamentos');
    
    const checkConnection = async () => {
      try {
        setLoadingSupabase(true);
        console.log('Verificando conexão com o Supabase...');
        
        const { success } = await checkSupabaseConnection();
        
        if (success) {
          console.log('Conexão com o Supabase estabelecida com sucesso');
          setSupabaseConnected(true);
          loadSupabaseQuotes();
        } else {
          console.error('Falha ao conectar ao Supabase');
          setSupabaseConnected(false);
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setSupabaseConnected(false);
      } finally {
        setLoadingSupabase(false);
      }
    };
    
    checkConnection();
  }, []);
  
  const loadSupabaseQuotes = async () => {
    try {
      console.log('Iniciando carregamento de orçamentos do Supabase...');
      const { quotes: data, success, error } = await getQuotesFromSupabase();
      
      if (success && data) {
        console.log(`Carregados ${data.length} orçamentos do Supabase com sucesso`);
        setSupabaseQuotes(data);
      } else {
        console.error('Erro ao carregar orçamentos do Supabase:', error);
        setError('Falha ao carregar orçamentos do Supabase');
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar orçamentos do Supabase:', error);
      setError('Erro inesperado ao carregar orçamentos');
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    loadSupabaseQuotes();
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Lista atualizada",
        description: "A lista de orçamentos foi atualizada com sucesso."
      });
    }, 1000);
  };

  // Combinação dos orçamentos locais (mock) e do Supabase
  const allQuotes: QuoteItem[] = [
    // DEMO: Orçamentos mockados apenas para desenvolvimento
    ...quotes.map(quote => ({
      id: quote.id,
      clientName: getClientById(quote.clientId)?.name || 'Cliente não encontrado',
      vehicleName: getVehicleById(quote.vehicleId)?.brand + ' ' + getVehicleById(quote.vehicleId)?.model,
      value: quote.totalCost,
      createdAt: new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'demo' // Alterado para 'demo' para ficar mais claro
    })),
    
    // LOCAL: Orçamentos salvos localmente no navegador
    ...(savedQuotes || []).map(quote => ({
      id: quote.id,
      clientName: quote.clientName,
      vehicleName: quote.vehicles && quote.vehicles.length > 0 ? 
        `${quote.vehicles[0].vehicleBrand} ${quote.vehicles[0].vehicleModel}` : 
        'Veículo não especificado',
      value: quote.totalCost,
      createdAt: quote.createdAt || new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'local'
    })),
    
    // SUPABASE: Orçamentos carregados do Supabase
    ...supabaseQuotes.map(quote => ({
      id: quote.id,
      clientName: quote.client?.name || 'Cliente não encontrado',
      vehicleName: quote.items && quote.items.length > 0 && quote.items[0].vehicle ? 
        `${quote.items[0].vehicle.brand} ${quote.items[0].vehicle.model}` : 
        'Veículo não especificado',
      value: quote.total_value || 0,
      createdAt: quote.created_at,
      status: quote.status_flow || 'ORCAMENTO',
      source: 'supabase' // Garantir que isso está definido corretamente
    }))
  ];
  
  // Ordenar por data de criação (mais recente primeiro)
  allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Estatísticas básicas
  const totalQuotes = allQuotes.length;
  const totalValue = allQuotes.reduce((sum, quote) => sum + Number(quote.value), 0);
  const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
  
  return {
    allQuotes,
    totalQuotes,
    totalValue,
    avgValue,
    loading,
    loadingSupabase,
    error,
    supabaseConnected,
    handleRefresh
  };
};
