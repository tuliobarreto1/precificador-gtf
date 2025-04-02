
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, Car, FileText, Plus, Settings, Users } from 'lucide-react';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/useQuotes';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const navigate = useNavigate();
  const { allQuotes, loading, loadingSupabase, totalQuotes } = useQuotes();
  
  // Selecionar apenas os 5 orçamentos mais recentes para exibição
  const recentQuotes = allQuotes.slice(0, 5);

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Painel Principal</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Resumo de Orçamentos</CardTitle>
            <CardDescription>Visão geral e status dos seus orçamentos</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total de orçamentos</div>
                <div className="text-2xl font-bold">
                  {loadingSupabase ? <Skeleton className="h-8 w-16" /> : totalQuotes}
                </div>
              </div>
            </div>
            
            <div className="relative">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentQuotes.length > 0 ? (
                <QuoteTable 
                  quotes={recentQuotes} 
                  loading={loading}
                />
              ) : (
                <div className="text-center py-8 bg-muted rounded-md">
                  <p className="text-muted-foreground">Nenhum orçamento encontrado.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate('/orcamento/novo')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar orçamento
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/orcamentos')}>
              Ver todos os orçamentos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/orcamento/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Clientes</CardTitle>
            <CardDescription>Gerenciar cadastros de clientes</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              Cadastre e gerencie seus clientes para acelerar a criação de orçamentos.
            </p>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/clientes')}>
              Ver clientes
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/cliente/novo')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo cliente
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Veículos</CardTitle>
            <CardDescription>Gerenciar frota de veículos</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <Car className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              Cadastre veículos e configure parâmetros para cálculos precisos nos orçamentos.
            </p>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/veiculos')}>
              Ver veículos
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/veiculo/novo')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo veículo
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Parâmetros</CardTitle>
            <CardDescription>Configurações do sistema</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-purple-100 p-3 rounded-full mb-4">
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              Configure os parâmetros do sistema para cálculos de depreciação, manutenção e mais.
            </p>
          </CardContent>
          
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/parametros')}
            >
              Configurar parâmetros
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Análise de Dados</CardTitle>
            <CardDescription>Estatísticas e gráficos</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-amber-100 p-3 rounded-full mb-4">
              <BarChart3 className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              Visualize estatísticas sobre orçamentos, conversões e rendimento da frota.
            </p>
          </CardContent>
          
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/analise')}
            >
              Ver estatísticas
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
