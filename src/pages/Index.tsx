
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/ui-custom/StatsCard';
import { Car, Users, FileText, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, adminUser } = useAuth();

  // Dados estáticos para os cards de estatísticas
  const statsData = {
    orcamentos: {
      valor: "28",
      trend: { value: 12, isPositive: true }
    },
    clientes: {
      valor: "124",
      trend: { value: 4, isPositive: true }
    },
    veiculos: {
      valor: "67",
      trend: { value: 0, isPositive: true }
    },
    faturamento: {
      valor: "R$ 128.400,00",
      trend: { value: 18, isPositive: true }
    }
  };

  // Obter o nome do usuário de forma segura
  const userName = user?.email?.split('@')[0] || adminUser?.name || '';

  return (
    <MainLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Bem-vindo{userName ? `, ${userName}` : ''}!
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Orçamentos"
            value={statsData.orcamentos.valor}
            icon={<FileText className="h-6 w-6" />}
            trend={statsData.orcamentos.trend}
          />
          <StatsCard
            title="Clientes"
            value={statsData.clientes.valor}
            icon={<Users className="h-6 w-6" />}
            trend={statsData.clientes.trend}
          />
          <StatsCard
            title="Veículos"
            value={statsData.veiculos.valor}
            icon={<Car className="h-6 w-6" />}
            trend={statsData.veiculos.trend}
          />
          <StatsCard
            title="Faturamento"
            value={statsData.faturamento.valor}
            icon={<Settings className="h-6 w-6" />}
            trend={statsData.faturamento.trend}
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

export default Index;
