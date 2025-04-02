
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, List, Settings, PieChart, TrendingUp, Clock, Calendar } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import StatsCard from '@/components/ui-custom/StatsCard';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuote } from '@/context/QuoteContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { fetchSystemSettings } from '@/lib/settings';
import { savedQuotes as mockSavedQuotes } from '@/lib/models';
import { getQuotesFromSupabase } from '@/integrations/supabase';

const Index = () => {
  const [companyName, setCompanyName] = useState('Car Lease Master');
  const [loading, setLoading] = useState(true);
  const [allQuotes, setAllQuotes] = useState([]);
  
  // Garantir que temos acesso ao contexto de orçamentos
  const quoteContext = useQuote();
  
  // Buscamos todas as fontes de dados disponíveis
  useEffect(() => {
    const fetchAllQuotes = async () => {
      setLoading(true);
      try {
        // 1. Buscar orçamentos do contexto
        const contextQuotes = quoteContext?.savedQuotes || [];
        
        // 2. Buscar orçamentos do Supabase
        let supabaseQuotes = [];
        try {
          const { quotes, success } = await getQuotesFromSupabase();
          if (success && Array.isArray(quotes)) {
            supabaseQuotes = quotes;
            console.log("Orçamentos do Supabase carregados:", quotes.length);
          }
        } catch (error) {
          console.error("Erro ao buscar orçamentos do Supabase:", error);
        }
        
        // 3. Usar dados simulados como último recurso
        const combinedQuotes = [...contextQuotes, ...supabaseQuotes];
        
        // Se não encontrarmos nada, usar dados mockados
        const finalQuotes = combinedQuotes.length > 0 ? combinedQuotes : mockSavedQuotes;
        
        setAllQuotes(finalQuotes);
      } catch (error) {
        console.error("Erro ao buscar orçamentos:", error);
        setAllQuotes(mockSavedQuotes);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllQuotes();
  }, [quoteContext?.savedQuotes]);
  
  // Carregar configurações básicas
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();
        const companyNameSetting = settings.find(s => s.key === 'company_name');
        if (companyNameSetting) {
          setCompanyName(companyNameSetting.value);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Garantir que allQuotes é sempre um array
  const safeQuotes = Array.isArray(allQuotes) ? allQuotes : [];
  
  // Obter orçamentos recentes (5 mais recentes)
  const recentQuotes = safeQuotes
    .sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime())
    .slice(0, 5)
    .map(quote => {
      // Lidar com diferentes formatos de dados
      const vehicleName = quote.vehicles && quote.vehicles.length > 0 
        ? `${quote.vehicles[0].vehicleBrand || quote.vehicles[0].vehicle?.brand || ''} ${quote.vehicles[0].vehicleModel || quote.vehicles[0].vehicle?.model || ''}` 
        : quote.vehicleBrand && quote.vehicleModel 
          ? `${quote.vehicleBrand} ${quote.vehicleModel}`
          : 'Veículo não especificado';

      return {
        id: quote.id,
        clientName: quote.clientName || quote.client?.name || 'Cliente não especificado',
        vehicleName: vehicleName,
        value: quote.totalCost || quote.total_value || 0,
        createdAt: quote.createdAt || quote.created_at || new Date().toISOString(),
        status: quote.status || quote.status_flow || 'ORCAMENTO',
        source: quote.source || 'supabase'
      };
    });
  
  // Estatísticas derivadas dos orçamentos
  const totalQuotes = safeQuotes.length;
  const averageContractLength = totalQuotes > 0 
    ? safeQuotes.reduce((acc, q) => acc + (q.contractMonths || q.contract_months || 0), 0) / totalQuotes 
    : 0;
  const totalValue = safeQuotes.reduce((acc, q) => acc + (q.totalCost || q.total_value || 0), 0);
  const averageMonthlyValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
  const activeQuotes = safeQuotes.filter(q => (q.status !== 'CONCLUIDO' && q.status_flow !== 'CONCLUIDO')).length;

  return (
    <MainLayout>
      <div className="pt-8">
        <PageTitle 
          title={`Bem-vindo ao ${companyName}`} 
          subtitle="Gerencie seus orçamentos de locação de veículos" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total de Orçamentos" 
            value={totalQuotes} 
            icon={<FileText size={20} />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard 
            title="Valor Médio Mensal" 
            value={`R$ ${averageMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={<TrendingUp size={20} />}
            trend={{ value: 3.5, isPositive: true }}
          />
          <StatsCard 
            title="Prazo Médio" 
            value={`${Math.round(averageContractLength)} meses`} 
            icon={<Calendar size={20} />}
            trend={{ value: 2, isPositive: false }}
          />
          <StatsCard 
            title="Orçamentos Ativos" 
            value={activeQuotes} 
            icon={<Clock size={20} />}
            trend={{ value: 8, isPositive: true }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader 
                title="Orçamentos Recentes" 
                action={
                  <Link to="/orcamentos" className="text-sm text-primary hover:underline">
                    Ver todos
                  </Link>
                }
              />
              
              {recentQuotes.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p>Nenhum orçamento encontrado</p>
                  <Link to="/orcamento/novo" className="mt-4 inline-block">
                    <Button variant="default" size="sm">Criar primeiro orçamento</Button>
                  </Link>
                </div>
              ) : (
                <QuoteTable quotes={recentQuotes} />
              )}
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader title="Acesso Rápido" />
              
              <div className="grid grid-cols-1 gap-3 p-4">
                {[
                  { name: 'Novo Orçamento', icon: <FileText size={18} />, path: '/orcamento/novo' },
                  { name: 'Lista de Orçamentos', icon: <List size={18} />, path: '/orcamentos' },
                  { name: 'Configurações', icon: <Settings size={18} />, path: '/configuracoes' },
                  { name: 'Parâmetros', icon: <PieChart size={18} />, path: '/parametros' },
                ].map((item) => (
                  <Link key={item.name} to={item.path}>
                    <div className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                      "hover:bg-primary/5 border border-border hover:border-primary/30"
                    )}>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
