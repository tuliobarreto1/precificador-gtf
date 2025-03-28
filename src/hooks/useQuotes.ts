
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
          
          if (data[0]?.vehicles) {
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
    console.log('Processando informações de veículo para orçamento:', quote.id);
    
    // Verificar o novo formato com array de veículos diretamente no objeto de orçamento
    if (quote.vehicles && Array.isArray(quote.vehicles)) {
      // Para o novo formato onde vehicles é um array de objetos de veículo
      console.log(`Orçamento tem ${quote.vehicles.length} veículos (novo formato)`);
      
      if (quote.vehicles.length > 0) {
        const firstVehicle = quote.vehicles[0];
        console.log('Primeiro veículo:', firstVehicle);
        
        return { 
          name: `${firstVehicle.brand} ${firstVehicle.model}`, 
          value: firstVehicle.monthly_value || quote.monthly_value || quote.total_value || 0
        };
      }
    }
    
    // Verificar o formato antigo onde quote.vehicles são itens relacionados
    else if (quote.vehicles && Array.isArray(quote.vehicles) && quote.vehicles.length > 0 && quote.vehicles[0].vehicle) {
      console.log(`Orçamento tem ${quote.vehicles.length} itens relacionados (formato antigo)`);
      
      const firstItem = quote.vehicles[0];
      if (firstItem.vehicle) {
        console.log('Veículo encontrado no item:', firstItem.vehicle);
        return { 
          name: `${firstItem.vehicle.brand} ${firstItem.vehicle.model}`, 
          value: firstItem.monthly_value || quote.total_value || 0
        };
      }
    }
    
    // Verificar formato antigo de items
    else if (quote.items && Array.isArray(quote.items) && quote.items.length > 0) {
      console.log(`Orçamento tem ${quote.items.length} itens`);
      
      // Pegar o primeiro item que tenha um veículo associado
      const itemWithVehicle = quote.items.find(item => item.vehicle);
      
      if (itemWithVehicle && itemWithVehicle.vehicle) {
        console.log('Veículo encontrado no item:', itemWithVehicle.vehicle);
        return { 
          name: `${itemWithVehicle.vehicle.brand} ${itemWithVehicle.vehicle.model}`, 
          value: itemWithVehicle.monthly_value || quote.total_value || 0
        };
      }
      
      // Se não encontrou veículo nos itens, tenta buscar pelo vehicle_id
      const firstItem = quote.items[0];
      if (firstItem.vehicle_id && supabaseVehicles.length > 0) {
        console.log('Buscando veículo pelo ID:', firstItem.vehicle_id);
        const vehicle = supabaseVehicles.find(v => v.id === firstItem.vehicle_id);
        if (vehicle) {
          console.log('Veículo encontrado pelo ID:', vehicle);
          return { 
            name: `${vehicle.brand} ${vehicle.model}`, 
            value: firstItem.monthly_value || quote.total_value || 0
          };
        }
      }
    }
    
    // Usar vehicle_id diretamente do orçamento se existir
    if (quote.vehicle_id && supabaseVehicles.length > 0) {
      console.log('Buscando veículo pelo ID direto no orçamento:', quote.vehicle_id);
      const vehicle = supabaseVehicles.find(v => v.id === quote.vehicle_id);
      if (vehicle) {
        return { 
          name: `${vehicle.brand} ${vehicle.model}`, 
          value: quote.monthly_value || quote.total_value || 0 
        };
      }
    }
    
    // Se não conseguiu encontrar informações do veículo de nenhuma forma
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
