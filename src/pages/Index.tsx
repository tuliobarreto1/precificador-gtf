
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { useAuth } from "@/context/AuthContext";
import { QuoteItem, User } from '@/context/types/quoteTypes';
import QuoteTable from '@/components/quotes/QuoteTable';
import QuoteStats from '@/components/quotes/QuoteStats';
import Card from '@/components/ui-custom/Card';
import { ArrowDownRight, ArrowUpRight, FileText, Clock, Plus } from 'lucide-react';
import { DataService } from '@/services/dataService';
import { toast } from 'sonner';

const Index = () => {
  const { adminUser } = useAuth();
  const [allQuotes, setAllQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando orçamentos no dashboard...');
      
      const result = await DataService.getQuotes();
      
      if (result.success && result.data) {
        console.log(`✅ ${result.data.length} orçamentos carregados`);
        
        const mappedQuotes: QuoteItem[] = result.data.map(quote => {
          let createdBy: User = {
            id: "system",
            name: "Sistema",
            email: "system@example.com",
            role: "system",
            status: "active"
          };
          
          if (quote.created_by) {
            createdBy = {
              id: String(quote.created_by),
              name: "Usuário",
              email: "usuario@example.com",
              role: "user",
              status: "active"
            };
          }
          
          return {
            id: quote.id,
            clientName: quote.clients?.name || "Cliente não especificado",
            vehicleName: quote.quote_vehicles && quote.quote_vehicles[0]?.vehicles
              ? `${quote.quote_vehicles[0].vehicles.brand} ${quote.quote_vehicles[0].vehicles.model}`
              : "Veículo não especificado",
            value: quote.total_value || 0,
            status: quote.status_flow || quote.status || "draft",
            createdAt: quote.created_at || new Date().toISOString(),
            contractMonths: quote.contract_months || 24,
            createdBy
          };
        });
        
        setAllQuotes(mappedQuotes);
        setError(null);
      } else {
        console.error('❌ Erro ao buscar orçamentos:', result.error);
        setError("Erro ao carregar orçamentos");
        toast.error("Erro ao carregar orçamentos");
      }
    } catch (err) {
      console.error('💥 Erro inesperado:', err);
      setError("Erro inesperado ao carregar orçamentos");
      toast.error("Erro inesperado ao carregar orçamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchQuotes();
    }
  }, [adminUser]);

  const handleRefresh = () => {
    fetchQuotes();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-red-500">
            <p>Erro: {error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calcular estatísticas
  const totalQuotes = allQuotes.length;
  const totalValue = allQuotes.reduce((sum, quote) => sum + Number(quote.value), 0);
  const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

  // Filtrar orçamentos recentes (últimos 5)
  const recentQuotes = [...allQuotes].slice(0, 5);

  return (
    <MainLayout>
      <PageTitle title="Dashboard" subtitle="Acompanhe seus orçamentos e estatísticas" />

      <div className="space-y-6">
        {/* Estatísticas */}
        <QuoteStats 
          totalQuotes={totalQuotes} 
          totalValue={totalValue} 
          avgValue={avgValue} 
        />

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link to="/orcamento/novo">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
          <Link to="/orcamentos">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ver Todos Orçamentos
            </Button>
          </Link>
        </div>

        {/* Orçamentos recentes */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Orçamentos Recentes</h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <Clock className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          
          <div className="rounded-md border">
            <QuoteTable 
              quotes={recentQuotes}
              onRefresh={handleRefresh} 
            />
          </div>
          
          {recentQuotes.length > 0 && (
            <div className="mt-4 text-right">
              <Link to="/orcamentos">
                <Button variant="link">Ver todos os orçamentos →</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
