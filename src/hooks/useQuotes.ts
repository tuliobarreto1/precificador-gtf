
import { useState, useEffect, useCallback } from 'react';
import { useQuote } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { getQuotes, getClientById, getVehicleById, savedQuotes, getVehicleGroupById, mockClients, mockVehicles } from '@/lib/data-provider';
import { Client, Vehicle } from '@/lib/models';
import { 
  checkSupabaseConnection, 
  getQuotesFromSupabase, 
  getVehiclesFromSupabase 
} from '@/integrations/supabase';

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
  const [demoQuotes, setDemoQuotes] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { toast } = useToast();

  // Método para atualizar diretamente o refreshTrigger (útil para chamadas externas)
  const setRefreshTriggerDirectly = () => {
    console.log("🔄 Atualizando trigger de atualização diretamente");
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    console.log('Hook useQuotes montado ou refreshTrigger atualizado:', refreshTrigger);
    
    const loadDemoQuotes = async () => {
      try {
        const quotes = await getQuotes();
        setDemoQuotes(quotes);
      } catch (err) {
        console.error('Erro ao carregar orçamentos demo:', err);
      }
    };
    
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
          await loadDemoQuotes();
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setSupabaseConnected(false);
        await loadDemoQuotes();
      } finally {
        setLoadingSupabase(false);
      }
    };
    
    checkConnection();
  }, [refreshTrigger]);
  
  const loadSupabaseVehicles = async () => {
    try {
      console.log('Iniciando carregamento de veículos do Supabase...');
      const { vehicles, success, error } = await getVehiclesFromSupabase();
      
      if (success && Array.isArray(vehicles)) {
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
      
      if (success && Array.isArray(data)) {
        console.log(`Carregados ${data.length} orçamentos do Supabase com sucesso`);
        
        if (data.length > 0) {
          console.log('Amostra do primeiro orçamento:', data[0]);
          
          if (data[0]?.vehicles && data[0]?.vehicles.length > 0) {
            console.log('Veículos do primeiro orçamento:', data[0].vehicles);
          }
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
  
  const handleRefresh = useCallback(() => {
    setLoading(true);
    console.log('🔄 Atualizando lista de orçamentos via handleRefresh...');
    
    // Incrementar o contador para forçar a recarga de dados
    setRefreshTrigger(prev => prev + 1);
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Lista atualizada",
        description: "A lista de orçamentos foi atualizada com sucesso."
      });
    }, 1000);
  }, [toast]);

  const getVehicleInfo = (quote: any) => {
    console.log('Processando informações de veículo para orçamento:', quote.id);
    
    if (quote.vehicles && Array.isArray(quote.vehicles) && quote.vehicles.length > 0) {
      console.log('Veículos encontrados no array vehicles:', quote.vehicles.length);
      const firstVehicle = quote.vehicles[0];
      
      if (firstVehicle.vehicle) {
        return { 
          name: `${firstVehicle.vehicle.brand} ${firstVehicle.vehicle.model}`, 
          value: firstVehicle.monthly_value || quote.total_value || 0
        };
      } else if (firstVehicle.brand && firstVehicle.model) {
        return {
          name: `${firstVehicle.brand} ${firstVehicle.model}`,
          value: firstVehicle.monthly_value || quote.total_value || 0
        };
      } else {
        return { 
          name: 'Veículo não especificado', 
          value: quote.total_value || 0 
        };
      }
    }
    
    if (quote.vehicle) {
      console.log('Veículo encontrado diretamente no orçamento:', quote.vehicle);
      return { 
        name: `${quote.vehicle.brand} ${quote.vehicle.model}`, 
        value: quote.monthly_values || quote.total_value || 0
      };
    }
    
    if (quote.vehicle_id && supabaseVehicles.length > 0) {
      console.log('Buscando veículo pelo ID:', quote.vehicle_id);
      const vehicle = supabaseVehicles.find(v => v.id === quote.vehicle_id);
      if (vehicle) {
        console.log('Veículo encontrado pelo ID:', vehicle);
        return { 
          name: `${vehicle.brand} ${vehicle.model}`, 
          value: quote.monthly_values || quote.total_value || 0 
        };
      }
    }
    
    return { name: 'Veículo não especificado', value: quote.total_value || 0 };
  };

  const transformQuotes = () => {
    const getClientNameSync = (clientId: string): string => {
      const client = mockClients.find(c => c.id === clientId);
      return client?.name || 'Cliente não encontrado';
    };

    const getVehicleDetailsSync = (vehicleId: string): {brand: string, model: string} => {
      const vehicle = mockVehicles.find(v => v.id === vehicleId);
      return {
        brand: vehicle?.brand || 'Marca desconhecida',
        model: vehicle?.model || 'Modelo desconhecido'
      };
    };

    const demoQuotesTransformed = demoQuotes.map(quote => ({
      id: quote.id,
      clientName: getClientNameSync(quote.clientId),
      vehicleName: (() => {
        const vehicle = getVehicleDetailsSync(quote.vehicleId);
        return `${vehicle.brand} ${vehicle.model}`;
      })(),
      value: quote.totalCost,
      createdAt: quote.createdAt || new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'demo' as const
    }));
    
    const localQuotesTransformed = (savedQuotes || []).map(quote => ({
      id: quote.id,
      clientName: quote.clientName || 'Cliente não especificado',
      vehicleName: quote.vehicles && quote.vehicles.length > 0 ? 
        `${quote.vehicles[0].vehicleBrand} ${quote.vehicles[0].vehicleModel}` : 
        'Veículo não especificado',
      value: quote.totalCost || 0,
      createdAt: quote.createdAt || new Date().toISOString(),
      status: 'ORCAMENTO',
      source: 'local' as const
    }));
    
    const supabaseQuotesTransformed = supabaseQuotes.map(quote => {
      console.log('Processando orçamento do Supabase:', quote.id);
      
      const clientName = quote.client_name || (quote.client && quote.client.name) || 'Cliente não especificado';
      console.log('Nome do cliente:', clientName);
      
      const vehicleInfo = getVehicleInfo(quote);
      console.log('Informações de veículo para orçamento:', quote.id, vehicleInfo);
      
      return {
        id: quote.id,
        clientName: clientName,
        vehicleName: vehicleInfo.name,
        value: vehicleInfo.value || quote.total_value || 0,
        createdAt: quote.created_at || new Date().toISOString(),
        status: quote.status_flow || 'ORCAMENTO',
        source: 'supabase' as const
      };
    });

    return [...demoQuotesTransformed, ...localQuotesTransformed, ...supabaseQuotesTransformed];
  };

  const [allQuotes, setAllQuotes] = useState<QuoteItem[]>([]);
  
  useEffect(() => {
    const quotes = transformQuotes();
    quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log(`🔄 Lista de orçamentos atualizada: ${quotes.length} orçamentos`);
    setAllQuotes(quotes);
  }, [demoQuotes, supabaseQuotes, savedQuotes, refreshTrigger]);
  
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
    handleRefresh,
    setRefreshTriggerDirectly
  };
};
