
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Calendar, User } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { QuoteItem } from '@/context/types/quoteTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuoteTable from '@/components/quotes/QuoteTable';

const Index = () => {
  const { user, adminUser } = useAuth();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);

      try {
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
            monthly_values,
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
          setError("Erro ao carregar os orçamentos.");
        } else {
          console.log("Orçamentos carregados:", data);
          
          // Mapear para o formato esperado pelo componente QuoteTable
          const mappedQuotes: QuoteItem[] = (data || []).map(quote => ({
            id: quote.id,
            clientName: quote.clients?.name || "Cliente não especificado",
            vehicleName: quote.quote_vehicles && quote.quote_vehicles[0]?.vehicles
              ? `${quote.quote_vehicles[0].vehicles.brand} ${quote.quote_vehicles[0].vehicles.model}`
              : "Veículo não especificado",
            value: quote.total_value || quote.monthly_values || 0,
            status: quote.status_flow || quote.status || "draft",
            createdAt: quote.created_at || new Date().toISOString(),
            contractMonths: quote.contract_months,
            createdBy: {
              id: "system",
              name: "Sistema",
              email: "system@example.com",
              role: "system",
              status: "active"
            }
          }));
          
          setQuotes(mappedQuotes);
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
        setError("Ocorreu um erro inesperado ao carregar os orçamentos.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          Carregando orçamentos...
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full text-red-500">
          Erro: {error}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageTitle title="Dashboard" subtitle="Acompanhe seus orçamentos" />

      <div className="space-y-4">
        <div className="rounded-md border">
          <QuoteTable quotes={quotes} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
