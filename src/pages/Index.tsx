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

const Index = () => {
  const { user, adminUser } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
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
              vehicle_id,
              vehicles (
                brand,
                model
              )
            ),
            created_by (
              id,
              name,
              email,
              role
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Erro ao buscar orçamentos:", error);
          setError("Erro ao carregar os orçamentos.");
        } else {
          setQuotes(data || []);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Data/Hora</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Criado por</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Nenhum orçamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                // Mapear dados para o formato esperado pelo componente QuoteTable
                quotes.map(quote => ({
                  id: quote.id,
                  clientName: quote.client?.name || quote.clientName || "Cliente não especificado",
                  vehicleName: quote.vehicles?.[0]?.vehicles?.brand
                    ? `${quote.vehicles[0].vehicles.brand} ${quote.vehicles[0].vehicles.model}`
                    : "Veículo não especificado",
                  value: quote.total_value || quote.monthly_values || 0,
                  status: quote.status_flow || quote.status || "draft",
                  contractMonths: quote.contract_months,
                  createdAt: quote.created_at || new Date().toISOString(),
                  createdBy: quote.created_by ? {
                    id: quote.created_by.id || "system",
                    name: quote.created_by.name || "Sistema",
                    email: quote.created_by.email || "system@example.com",
                    role: quote.created_by.role
                  } : undefined
                })).map((quote: QuoteItem) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link to={`/orcamento/${quote.id}`}>
                        <span className="font-medium hover:text-primary">
                          {quote.clientName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{quote.vehicleName}</TableCell>
                    <TableCell>
                      R$ {Number(quote.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{quote.status}</TableCell>
                    <TableCell>
                      {quote.createdAt && format(new Date(quote.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {quote.createdBy?.name || "Sistema"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/orcamento/${quote.id}`}>
                        <Button variant="link" size="sm">Ver</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
