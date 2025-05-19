
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuoteItem } from '@/context/types/quoteTypes';

export const useQuotesDataFetching = () => {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Iniciando busca de orçamentos...");
      const { data, error } = await supabase
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
          created_by,
          clients (
            id,
            name
          ),
          quote_vehicles (
            *,
            vehicle_id,
            vehicles:vehicle_id (
              brand,
              model
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar orçamentos:", error);
        setError(error.message);
        toast({
          title: "Erro ao carregar orçamentos",
          description: error.message,
          variant: "destructive"
        });
        setQuotes([]);
      } else {
        console.log("Orçamentos carregados:", data?.length || 0);
        
        // Transformar dados conforme necessário
        const mappedQuotes: QuoteItem[] = await Promise.all((data || []).map(async quote => {
          // Informações padrão do usuário criador
          let createdBy = {
            id: "system",
            name: "Sistema",
            email: "system@example.com",
            role: "system",
            status: "active"
          };
          
          // Tentar obter informações do usuário criador, se disponível
          if (quote.created_by) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('system_users')
                .select('id, name, email, role')
                .eq('id', quote.created_by)
                .maybeSingle();
                
              if (!userError && userData) {
                createdBy = {
                  id: userData.id || "system",
                  name: userData.name || "Sistema",
                  email: userData.email || "system@example.com",
                  role: userData.role || "system",
                  status: "active"
                };
              }
            } catch (err) {
              console.error("Erro ao buscar usuário:", err);
            }
          }
          
          // Obter informações do veículo, se disponível
          const vehicleName = quote.quote_vehicles && quote.quote_vehicles[0]?.vehicles
            ? `${quote.quote_vehicles[0].vehicles.brand} ${quote.quote_vehicles[0].vehicles.model}`
            : "Veículo não especificado";
          
          return {
            id: quote.id,
            clientName: quote.clients?.name || "Cliente não especificado",
            vehicleName: vehicleName,
            value: quote.total_value || 0,
            status: quote.status_flow || quote.status || "draft",
            createdAt: quote.created_at || new Date().toISOString(),
            contractMonths: quote.contract_months || 24,
            createdBy
          };
        }));
        
        setQuotes(mappedQuotes);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast({
        title: "Erro ao carregar orçamentos",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carregar orçamentos automaticamente ao montar o componente
  useEffect(() => {
    console.log("Efeito de carregamento de orçamentos iniciado");
    fetchQuotes();
  }, [fetchQuotes]);

  const handleRefresh = useCallback(() => {
    fetchQuotes();
    toast({
      title: "Atualizando orçamentos",
      description: "A lista de orçamentos está sendo atualizada."
    });
  }, [fetchQuotes, toast]);

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
    handleRefresh
  };
};
