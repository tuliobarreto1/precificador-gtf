
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, List, Settings, PieChart, TrendingUp, Clock, Calendar, Shield } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import StatsCard from '@/components/ui-custom/StatsCard';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/useQuotes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { fetchSystemSettings } from '@/lib/settings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Index = () => {
  const [companyName, setCompanyName] = useState('Car Lease Master');
  const [loading, setLoading] = useState(true);
  
  // Utilizar o hook useQuotes com os novos recursos
  const { 
    filteredQuotes, 
    totalQuotes, 
    totalValue, 
    avgValue, 
    searchTerm,
    setSearchTerm
  } = useQuotes();
  
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
  const safeQuotes = Array.isArray(filteredQuotes) ? filteredQuotes : [];
  
  // Obter orçamentos recentes (5 mais recentes)
  const recentQuotes = safeQuotes
    .slice(0, 5)
    .map(quote => {
      return {
        id: quote.id,
        clientName: quote.clientName,
        vehicleName: quote.vehicleName,
        value: quote.value,
        createdAt: quote.createdAt,
        status: quote.status,
        contractMonths: quote.contractMonths || 0, // Garantir que existe
        createdBy: quote.createdBy
      };
    });
  
  // Estatísticas derivadas dos orçamentos reais
  const averageContractLength = totalQuotes > 0 
    ? safeQuotes.reduce((acc, q) => acc + (q.contractMonths || 0), 0) / totalQuotes 
    : 0;
  const averageMonthlyValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
  const activeQuotes = safeQuotes.filter(q => (q.status !== 'CONCLUIDO')).length;

  return (
    <MainLayout>
      <div className="pt-8">
        <PageTitle 
          title={`Bem-vindo ao ${companyName}`} 
          subtitle="Gerencie seus orçamentos de locação de veículos" 
        />
        
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertTitle>Novo Recurso: Planos de Proteção</AlertTitle>
          <AlertDescription>
            Agora você pode adicionar planos de proteção aos seus orçamentos. Configure os valores na página de Parâmetros e adicione proteção aos veículos durante a criação de orçamentos.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total de Orçamentos" 
            value={totalQuotes} 
            icon={<FileText size={20} />}
            trend={totalQuotes > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <StatsCard 
            title="Valor Médio Mensal" 
            value={`R$ ${averageMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={<TrendingUp size={20} />}
            trend={averageMonthlyValue > 0 ? { value: 3.5, isPositive: true } : undefined}
          />
          <StatsCard 
            title="Prazo Médio" 
            value={`${Math.round(averageContractLength)} meses`} 
            icon={<Calendar size={20} />}
            trend={averageContractLength > 0 ? { value: 2, isPositive: false } : undefined}
          />
          <StatsCard 
            title="Orçamentos Ativos" 
            value={activeQuotes} 
            icon={<Clock size={20} />}
            trend={activeQuotes > 0 ? { value: 8, isPositive: true } : undefined}
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
