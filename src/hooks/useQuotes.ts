
import { useState, useEffect } from 'react';
import { useQuote } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { quotes, getClientById, getVehicleById } from '@/lib/mock-data';
import { checkSupabaseConnection, getQuotesFromSupabase, getVehiclesFromSupabase } from '@/integrations/supabase/client';

// Definindo o tipo com source restrito aos valores permitidos
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
  const [supabaseVehicles, setSupabaseVehicles] = useState<any[]>([]);
  
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
          await loadSupabaseVehicles();
          await loadSupabaseQuotes();
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
  
  const loadSupabaseVehicles = async () => {
    try {
      console.log('Iniciando carregamento de veículos do Supabase...');
      const { vehicles, success, error } = await getVehiclesFromSupabase();
      
      if (success && vehicles) {
        console.log(`Carregados ${vehicles.length} veículos do Supabase com sucesso`);
        setSupabaseVehicles(vehicles);
      } else {
        console.error('Erro ao carregar veículos do Supabase:', error);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar veículos do Supabase:', error);
    }
  };
  
  const loadSupabaseQuotes = async () => {
    try {
      console.log('Iniciando carregamento de orçamentos do Supabase...');
      const { quotes: data, success, error } = await getQuotesFromSupabase();
      
      if (success && data) {
        console.log(`Carregados ${data.length} orçamentos do Supabase com sucesso`);
        console.log('Amostra do primeiro orçamento:', data[0]);
        
        if (data[0]?.items) {
          console.log('Itens do primeiro orçamento:', data[0].items);
        }
        
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
    loadSupabaseVehicles();
    loadSupabaseQuotes();
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Lista atualizada",
        description: "A lista de orçamentos foi atualizada com sucesso."
      });
    }, 1000);
  };

  // Função auxiliar para obter informações do veículo para orçamentos do Supabase
  const getVehicleInfo = (quote: any) => {
    if (quote.items && quote.items.length > 0) {
      const firstItem = quote.items[0];
      
      if (firstItem.vehicle && firstItem.vehicle.brand && firstItem.vehicle.model) {
        return { 
          name: `${firstItem.vehicle.brand} ${firstItem.vehicle.model}`, 
          value: firstItem.monthly_value || quote.total_value || 0
        };
      }
      
      if (firstItem.vehicle_id && supabaseVehicles.length > 0) {
        const vehicle = supabaseVehicles.find(v => v.id === firstItem.vehicle_id);
        if (vehicle) {
          return { 
            name: `${vehicle.brand} ${vehicle.model}`, 
            value: firstItem.monthly_value || quote.total_value || 0
          };
        }
      }
      
      return { 
        name: 'Veículo não especificado', 
        value: firstItem.monthly_value || quote.total_value || 0
      };
    }
    
    return { name: 'Veículo não especificado', value: quote.total_value || 0 };
  };

  // Combinação dos orçamentos locais (mock) e do Supabase
  const allQuotes: QuoteItem[] = [
    ...quotes.map(quote => ({
      id: quote.id,
      clientName: getClientById(quote.clientId)?.name || 'Cliente não encontrado',
      vehicleName: getVehicleById(quote.vehicleId)?.brand + ' ' + getVehicleById(quote.vehicleId)?.model,
      value: quote.totalCost,
      createdAt: new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'demo' as const
    })),
    
    ...(savedQuotes || []).map(quote => ({
      id: quote.id,
      clientName: quote.clientName || 'Cliente não especificado',
      vehicleName: quote.vehicles && quote.vehicles.length > 0 ? 
        `${quote.vehicles[0].vehicleBrand} ${quote.vehicles[0].vehicleModel}` : 
        'Veículo não especificado',
      value: quote.totalCost || 0,
      createdAt: quote.createdAt || new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'local' as const
    })),
    
    ...supabaseQuotes.map(quote => {
      console.log('Processando orçamento do Supabase:', quote.id, quote);
      
      const vehicleInfo = getVehicleInfo(quote);
      console.log('Informações de veículo para orçamento:', quote.id, vehicleInfo);
      
      return {
        id: quote.id,
        clientName: quote.client?.name || 'Cliente não especificado',
        vehicleName: vehicleInfo.name,
        value: vehicleInfo.value || quote.total_value || 0,
        createdAt: quote.created_at || new Date().toISOString(),
        status: quote.status_flow || 'ORCAMENTO',
        source: 'supabase' as const
      };
    })
  ];
  
  allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
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
