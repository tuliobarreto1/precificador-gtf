import { useState, useEffect, useCallback } from 'react';
import { useQuote } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  createdBy?: {
    id: number;
    name: string;
    role: string;
  };
}

interface QuoteFilters {
  status: string | null;
  dateRange: string | null;
  createdBy: string | null;
}

export interface UseQuotesReturn {
  allQuotes: QuoteItem[];
  filteredQuotes: QuoteItem[];
  totalQuotes: number;
  totalValue: number;
  avgValue: number;
  loading: boolean;
  loadingSupabase: boolean;
  error: string | null;
  searchTerm: string;
  filters: QuoteFilters;
  handleRefresh: () => void;
  setSearchTerm: (term: string) => void;
  setFilter: (key: keyof QuoteFilters, value: string | null) => void;
  clearFilters: () => void;
  setRefreshTriggerDirectly: () => void;
}

export const useQuotes = (): UseQuotesReturn => {
  const [loading, setLoading] = useState(false);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseQuotes, setSupabaseQuotes] = useState<any[]>([]);
  const [supabaseVehicles, setSupabaseVehicles] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<QuoteFilters>({
    status: null,
    dateRange: null,
    createdBy: null
  });
  
  const { toast } = useToast();
  const quoteContext = useQuote();

  const setRefreshTriggerDirectly = () => {
    console.log("🔄 Atualizando trigger de atualização diretamente");
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    console.log('Hook useQuotes montado ou refreshTrigger atualizado:', refreshTrigger);
    
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
      } else if (firstVehicle.vehicleBrand && firstVehicle.vehicleModel) {
        return {
          name: `${firstVehicle.vehicleBrand} ${firstVehicle.vehicleModel}`,
          value: firstVehicle.totalCost || quote.total_value || 0
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
    
    if (quote.vehicleBrand && quote.vehicleModel) {
      return {
        name: `${quote.vehicleBrand} ${quote.vehicleModel}`,
        value: quote.totalCost || quote.total_value || 0
      };
    }
    
    return { name: 'Veículo não especificado', value: quote.total_value || quote.totalCost || 0 };
  };

  const supabaseQuotesTransformed = supabaseQuotes.map(quote => {
    console.log('Processando orçamento do Supabase:', quote.id);
    
    const clientName = quote.client_name || (quote.client && quote.client.name) || 'Cliente não especificado';
    console.log('Nome do cliente:', clientName);
    
    const vehicleInfo = getVehicleInfo(quote);
    console.log('Informações de veículo para orçamento:', quote.id, vehicleInfo);
    
    const createdByInfo = {
      id: 0,
      name: 'Sistema',
      role: 'system'
    };
    
    if (quote.created_by_name) {
      createdByInfo.name = quote.created_by_name;
    }
    
    const contractMonths = quote.contract_months || 
                          quote.contractMonths || 
                          (quote.globalParams ? quote.globalParams.contractMonths : 0) || 
                          0;
    
    return {
      id: quote.id,
      clientName: clientName,
      vehicleName: vehicleInfo.name,
      value: vehicleInfo.value || quote.total_value || 0,
      createdAt: quote.created_at || new Date().toISOString(),
      status: quote.status_flow || 'ORCAMENTO',
      contractMonths: contractMonths,
      createdBy: createdByInfo
    };
  });

  const [allQuotes, setAllQuotes] = useState<QuoteItem[]>([]);
  
  useEffect(() => {
    try {
      const quotes = [...supabaseQuotesTransformed];
      quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log(`🔄 Lista de orçamentos atualizada: ${quotes.length} orçamentos`);
      setAllQuotes(quotes);
    } catch (error) {
      console.error('Erro ao transformar orçamentos:', error);
    }
  }, [supabaseQuotes, refreshTrigger]);
  
  const applyDateFilter = (quote: QuoteItem, dateRange: string | null): boolean => {
    if (!dateRange) return true;
    
    const quoteDate = new Date(quote.createdAt);
    const today = new Date();
    
    switch (dateRange) {
      case 'today':
        return isToday(quoteDate);
      case 'yesterday':
        return isYesterday(quoteDate);
      case 'last7days':
        return quoteDate >= subDays(today, 7);
      case 'last30days':
        return quoteDate >= subDays(today, 30);
      case 'thisMonth':
        return quoteDate >= startOfMonth(today) && quoteDate <= endOfMonth(today);
      case 'lastMonth': {
        const lastMonth = subMonths(today, 1);
        return quoteDate >= startOfMonth(lastMonth) && quoteDate <= endOfMonth(lastMonth);
      }
      default:
        return true;
    }
  };
  
  const filteredQuotes = allQuotes.filter(quote => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      quote.clientName.toLowerCase().includes(searchLower) ||
      quote.vehicleName.toLowerCase().includes(searchLower) ||
      quote.id.toString().toLowerCase().includes(searchLower) ||
      (quote.createdBy?.name && quote.createdBy.name.toLowerCase().includes(searchLower));
    
    const matchesStatus = !filters.status || quote.status === filters.status;
    
    const matchesDateRange = applyDateFilter(quote, filters.dateRange);
    
    const matchesCreatedBy = !filters.createdBy || 
      (filters.createdBy === 'system' && quote.createdBy?.name === 'Sistema') ||
      (filters.createdBy === 'current' && quote.createdBy?.id === 1);
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesCreatedBy;
  });
  
  const setFilter = (key: keyof QuoteFilters, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({
      status: null,
      dateRange: null,
      createdBy: null
    });
  };
  
  const totalQuotes = allQuotes.length;
  const totalValue = allQuotes.reduce((sum, quote) => sum + Number(quote.value), 0);
  const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
  
  return {
    allQuotes,
    filteredQuotes,
    totalQuotes,
    totalValue,
    avgValue,
    loading,
    loadingSupabase,
    error,
    searchTerm,
    filters,
    handleRefresh,
    setSearchTerm,
    setFilter,
    clearFilters,
    setRefreshTriggerDirectly
  };
};
