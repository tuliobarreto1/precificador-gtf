
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Send, Edit, Trash } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { quotes, getClientById, getVehicleById, getVehicleGroupById } from '@/lib/mock-data';
import { calculateExtraKmRate } from '@/lib/calculation';

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Find the quote by ID
  const quote = quotes.find(q => q.id === id);
  
  // If quote not found, display error message
  if (!quote) {
    return (
      <MainLayout>
        <div className="py-8 text-center">
          <h2 className="text-2xl font-bold">Orçamento não encontrado</h2>
          <p className="mt-2 text-muted-foreground">O orçamento que você está procurando não existe.</p>
          <Link to="/orcamentos">
            <Button className="mt-6">Voltar para Orçamentos</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  // Get associated data
  const client = getClientById(quote.clientId);
  const vehicle = getVehicleById(quote.vehicleId);
  const vehicleGroup = vehicle ? getVehicleGroupById(vehicle.groupId) : undefined;
  
  // Calculate additional data
  const extraKmRate = vehicle ? calculateExtraKmRate(vehicle.value) : 0;
  const createdDate = new Date(quote.createdAt).toLocaleDateString('pt-BR');
  const totalKm = quote.monthlyKm * quote.contractMonths;
  
  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Link to="/orcamentos">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <PageTitle
              title={`Orçamento #${quote.id}`}
              subtitle={`Criado em ${createdDate}`}
              className="mb-0"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar por Email
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cliente e Veículo */}
          <Card className="lg:col-span-2">
            <CardHeader title="Informações Básicas" />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{client?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Documento</span>
                    <span>{client?.document}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {client?.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </Badge>
                  </div>
                  {client?.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Veículo</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Modelo</span>
                    <span className="font-medium">{vehicle?.brand} {vehicle?.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ano</span>
                    <span>{vehicle?.year}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Grupo</span>
                    <Badge variant="outline">{vehicleGroup?.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span>R$ {vehicle?.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Resumo */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader title="Valor Total" />
            <div className="p-4 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  R$ {quote.totalCost.toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  por mês
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prazo</span>
                  <span className="font-medium">{quote.contractMonths} meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Km Mensal</span>
                  <span className="font-medium">{quote.monthlyKm.toLocaleString('pt-BR')} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Km Total</span>
                  <span className="font-medium">{totalKm.toLocaleString('pt-BR')} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nível de Operação</span>
                  <span className="font-medium">{quote.operationSeverity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rastreamento</span>
                  <span className="font-medium">{quote.hasTracking ? 'Sim' : 'Não'}</span>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor do KM Excedente</span>
                  <span className="font-semibold">R$ {extraKmRate.toFixed(5)}</span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Detalhamento */}
          <Card className="lg:col-span-3">
            <CardHeader title="Detalhamento dos Custos" />
            <div className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Depreciação</span>
                      <span className="text-xl font-bold mt-1">R$ {quote.depreciationCost.toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {((quote.depreciationCost / quote.totalCost) * 100).toFixed(1)}% do valor total
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Manutenção</span>
                      <span className="text-xl font-bold mt-1">R$ {quote.maintenanceCost.toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {((quote.maintenanceCost / quote.totalCost) * 100).toFixed(1)}% do valor total
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Rastreamento</span>
                      <span className="text-xl font-bold mt-1">R$ {quote.trackingCost.toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {((quote.trackingCost / quote.totalCost) * 100).toFixed(1)}% do valor total
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Custo por KM</span>
                      <span className="text-xl font-bold mt-1">R$ {quote.costPerKm.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Baseado na quilometragem contratada
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-medium mb-4">Parâmetros de Manutenção</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {vehicleGroup && (
                      <>
                        <div className="p-4 border rounded-md">
                          <span className="text-muted-foreground text-sm">Intervalo de Revisão</span>
                          <p className="font-medium">{vehicleGroup.revisionKm.toLocaleString('pt-BR')} km</p>
                        </div>
                        
                        <div className="p-4 border rounded-md">
                          <span className="text-muted-foreground text-sm">Custo por Revisão</span>
                          <p className="font-medium">R$ {vehicleGroup.revisionCost.toLocaleString('pt-BR')}</p>
                        </div>
                        
                        <div className="p-4 border rounded-md">
                          <span className="text-muted-foreground text-sm">Intervalo de Troca de Pneus</span>
                          <p className="font-medium">{vehicleGroup.tireKm.toLocaleString('pt-BR')} km</p>
                        </div>
                        
                        <div className="p-4 border rounded-md">
                          <span className="text-muted-foreground text-sm">Custo de Troca de Pneus</span>
                          <p className="font-medium">R$ {vehicleGroup.tireCost.toLocaleString('pt-BR')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteDetail;
