import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, List, Settings, PieChart, TrendingUp, Clock, Calendar } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import StatsCard from '@/components/ui-custom/StatsCard';
import { quotes } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const Index = () => {
  // Stats derived from mock data
  const totalQuotes = quotes.length;
  const averageContractLength = quotes.reduce((acc, q) => acc + q.contractMonths, 0) / totalQuotes;
  const averageMonthlyValue = quotes.reduce((acc, q) => acc + q.totalCost, 0) / totalQuotes;
  
  // Recent quotes from mock data
  const recentQuotes = [...quotes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <MainLayout>
      <div className="pt-8">
        <PageTitle 
          title="Bem-vindo ao Precificador GTF" 
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
            value={`R$ ${averageMonthlyValue.toLocaleString('pt-BR')}`} 
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
            value={totalQuotes - 1} 
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
              
              <div className="space-y-4">
                {recentQuotes.map((quote) => (
                  <Link 
                    key={quote.id}
                    to={`/orcamento/${quote.id}`}
                    className="block"
                  >
                    <div className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">Orçamento #{quote.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                          {' • '}
                          {quote.contractMonths} meses
                          {' • '}
                          {quote.monthlyKm} km/mês
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {quote.totalCost.toLocaleString('pt-BR')}</p>
                        <p className="text-sm text-muted-foreground">por mês</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader title="Acesso Rápido" />
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: 'Novo Orçamento', icon: <FileText size={18} />, path: '/orcamento/novo' },
                  { name: 'Lista de Orçamentos', icon: <List size={18} />, path: '/orcamentos' },
                  { name: 'Configurações', icon: <Settings size={18} />, path: '/configuracoes' },
                  { name: 'Resultados', icon: <PieChart size={18} />, path: '/resultados' },
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
