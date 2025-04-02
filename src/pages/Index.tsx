
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/ui-custom/StatsCard';
import { Car, Users, FileText, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { QuoteProvider } from '@/context/QuoteContext';

const Index = () => {
  const { user, adminUser } = useAuth();

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Bem-vindo{user?.name ? `, ${user.name}` : adminUser?.name ? `, ${adminUser.name}` : ''}!
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Orçamentos"
            subtitle="Total de orçamentos"
            value="28"
            icon={<FileText className="h-6 w-6" />}
            trend="up"
            trendValue="12%"
          />
          <StatsCard
            title="Clientes"
            subtitle="Base de clientes"
            value="124"
            icon={<Users className="h-6 w-6" />}
            trend="up"
            trendValue="4%"
          />
          <StatsCard
            title="Veículos"
            subtitle="Frota gerenciada"
            value="67"
            icon={<Car className="h-6 w-6" />}
            trend="neutral"
            trendValue="0%"
          />
          <StatsCard
            title="Faturamento"
            subtitle="Último mês"
            value="R$ 128.400,00"
            icon={<Settings className="h-6 w-6" />}
            trend="up"
            trendValue="18%"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Gerencie todos os seus orçamentos em um só lugar.</p>
            </CardContent>
            <CardFooter>
              <Link to="/orcamentos">
                <Button>Ver Orçamentos</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Acesse a base de clientes e gerencie informações.</p>
            </CardContent>
            <CardFooter>
              <Link to="/clientes">
                <Button>Gerenciar Clientes</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Novo Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Crie um novo orçamento rápido para seus clientes.</p>
            </CardContent>
            <CardFooter>
              <Link to="/orcamento/novo">
                <Button variant="outline">Criar Orçamento</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

// Quando usarmos o QuoteProvider, usaremos na rota específica que precisa do QuoteContext
export default Index;
