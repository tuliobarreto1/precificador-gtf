
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Send, Edit, Trash, ChevronDown, ChevronUp, Car } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { quotes, getClientById, getVehicleById, getVehicleGroupById } from '@/lib/mock-data';
import { calculateExtraKmRate, getGlobalParams } from '@/lib/calculation';
import { SavedQuote } from '@/context/QuoteContext';

// Função para verificar se é um orçamento salvo
const isSavedQuote = (quote: any): quote is SavedQuote => {
  return 'clientName' in quote && 'vehicleBrand' in quote && 'vehicleModel' in quote;
};

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  
  // Buscar orçamentos salvos do localStorage
  const getSavedQuotes = (): SavedQuote[] => {
    const storedQuotes = localStorage.getItem('savedQuotes');
    if (storedQuotes) {
      try {
        return JSON.parse(storedQuotes);
      } catch (error) {
        console.error('Erro ao carregar orçamentos salvos:', error);
      }
    }
    return [];
  };
  
  // Buscar orçamento por ID (tanto mockados quanto salvos)
  const findQuoteById = (quoteId: string) => {
    // Primeiro buscar nos orçamentos mockados
    const mockQuote = quotes.find(q => q.id === quoteId);
    if (mockQuote) return mockQuote;
    
    // Se não encontrar, buscar nos salvos
    const savedQuotes = getSavedQuotes();
    return savedQuotes.find(q => q.id === quoteId);
  };
  
  // Encontrar o orçamento pelo ID
  const quote = id ? findQuoteById(id) : null;
  
  // Se orçamento não encontrado, exibir mensagem de erro
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
  
  // Definir variáveis com base no tipo de orçamento
  const isSaved = isSavedQuote(quote);
  
  // Obter dados relacionados
  let client, vehicle, vehicleGroup;
  
  if (isSaved) {
    // Para orçamentos salvos, usar os dados do próprio objeto
    client = {
      name: quote.clientName,
      document: '', // Podemos não ter essa informação no SavedQuote
      type: 'PJ', // Valor padrão, pode não ser preciso
      email: ''
    };
    
    // Para o veículo, usamos o primeiro da lista (se existir vários)
    const firstVehicle = quote.vehicles[0];
    if (firstVehicle) {
      vehicle = {
        id: firstVehicle.vehicleId,
        brand: firstVehicle.vehicleBrand,
        model: firstVehicle.vehicleModel,
        plateNumber: firstVehicle.plateNumber,
        year: '', // Pode não estar disponível
        value: 0, // Valor não disponível diretamente, mas podemos calculá-lo
        groupId: firstVehicle.groupId
      };
      
      // Obter o grupo do veículo
      vehicleGroup = getVehicleGroupById(firstVehicle.groupId);
    }
  } else {
    // Para orçamentos mockados, buscar dados relacionados
    client = getClientById(quote.clientId);
    vehicle = getVehicleById(quote.vehicleId);
    vehicleGroup = vehicle ? getVehicleGroupById(vehicle.groupId) : undefined;
  }
  
  // Obter parâmetros globais
  const globalParams = getGlobalParams();
  
  // Calcular dados adicionais
  let extraKmRate = 0;
  if (isSaved) {
    // Usar o valor armazenado no orçamento salvo
    const firstVehicle = quote.vehicles[0];
    if (firstVehicle) {
      extraKmRate = firstVehicle.extraKmRate;
    }
  } else if (vehicle) {
    // Calcular para orçamentos mockados
    extraKmRate = calculateExtraKmRate(vehicle.value);
  }
  
  const createdDate = new Date(quote.createdAt).toLocaleDateString('pt-BR');
  const totalKm = quote.monthlyKm * quote.contractMonths;
  
  // Calcular custos específicos com base no tipo de orçamento
  let depreciationCost = 0;
  let maintenanceCost = 0;
  let trackingCost = 0;
  
  if (isSaved) {
    // Para orçamentos salvos, acessar do primeiro veículo
    const firstVehicle = quote.vehicles[0];
    if (firstVehicle) {
      depreciationCost = firstVehicle.depreciationCost;
      maintenanceCost = firstVehicle.maintenanceCost;
    }
    // Orçamentos salvos podem não ter trackingCost especificado
    trackingCost = 0;
  } else {
    // Para orçamentos mockados, usar diretamente do objeto
    depreciationCost = quote.depreciationCost;
    maintenanceCost = quote.maintenanceCost;
    trackingCost = quote.trackingCost || 0;
  }
  
  // Cálculo do custo por km
  const costPerKm = isSaved 
    ? (totalKm > 0 ? quote.totalCost / totalKm : 0) 
    : (quote.costPerKm || 0);

  // Cálculo das porcentagens dos componentes de custo
  const totalCost = quote.totalCost;
  const depreciationPercentage = totalCost > 0 ? ((depreciationCost / totalCost) * 100).toFixed(1) : "0";
  const maintenancePercentage = totalCost > 0 ? ((maintenanceCost / totalCost) * 100).toFixed(1) : "0";
  const trackingPercentage = totalCost > 0 ? ((trackingCost / totalCost) * 100).toFixed(1) : "0";
  
  // Função para alternar a expansão de detalhes de veículo
  const toggleVehicleExpansion = (vehicleId: string) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
    } else {
      setExpandedVehicle(vehicleId);
    }
  };
  
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
                  {client?.document && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Documento</span>
                      <span>{client.document}</span>
                    </div>
                  )}
                  {!isSaved && client?.type && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <Badge variant="outline">
                        {client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </Badge>
                    </div>
                  )}
                  {client?.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Veículo Primário</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Modelo</span>
                    <span className="font-medium">{vehicle?.brand} {vehicle?.model}</span>
                  </div>
                  {vehicle?.year && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ano</span>
                      <span>{vehicle.year}</span>
                    </div>
                  )}
                  {vehicleGroup && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Grupo</span>
                      <Badge variant="outline">{vehicleGroup.name}</Badge>
                    </div>
                  )}
                  {isSaved ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Veículos</span>
                      <span>{quote.vehicles.length}</span>
                    </div>
                  ) : vehicle?.value ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valor</span>
                      <span>R$ {vehicle.value.toLocaleString('pt-BR')}</span>
                    </div>
                  ) : null}
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
                {!isSaved && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nível de Operação</span>
                      <span className="font-medium">{quote.operationSeverity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rastreamento</span>
                      <span className="font-medium">{quote.hasTracking ? 'Sim' : 'Não'}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor do KM Excedente</span>
                  <span className="font-semibold">R$ {extraKmRate.toFixed(2)}</span>
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
                      <span className="text-xl font-bold mt-1">R$ {depreciationCost.toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {depreciationPercentage}% do valor total
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Manutenção</span>
                      <span className="text-xl font-bold mt-1">R$ {maintenanceCost.toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {maintenancePercentage}% do valor total
                      </span>
                    </div>
                  </div>
                  
                  {!isSaved && (
                    <div className="p-4 border rounded-md bg-muted/10">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm">Rastreamento</span>
                        <span className="text-xl font-bold mt-1">R$ {trackingCost.toLocaleString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {trackingPercentage}% do valor total
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 border rounded-md bg-muted/10">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">Custo por KM</span>
                      <span className="text-xl font-bold mt-1">R$ {costPerKm.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Baseado na quilometragem contratada
                      </span>
                    </div>
                  </div>
                </div>
                
                {vehicleGroup && (
                  <div className="mt-8">
                    <h3 className="font-medium mb-4">Parâmetros de Manutenção</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Lista de Veículos Detalhados - Novo componente para múltiplos veículos */}
          {isSaved && quote.vehicles.length > 1 && (
            <Card className="lg:col-span-3">
              <CardHeader title="Detalhamento por Veículos" />
              <div className="p-4">
                <div className="space-y-4">
                  {quote.vehicles.map((vehicleItem) => {
                    const vehicleGroup = getVehicleGroupById(vehicleItem.groupId);
                    const isExpanded = expandedVehicle === vehicleItem.vehicleId;
                    
                    return (
                      <div key={vehicleItem.vehicleId} className="border rounded-md overflow-hidden">
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/10"
                          onClick={() => toggleVehicleExpansion(vehicleItem.vehicleId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Car className="text-primary h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{vehicleItem.vehicleBrand} {vehicleItem.vehicleModel}</h3>
                              <p className="text-sm text-muted-foreground">
                                {vehicleItem.plateNumber || 'Sem placa'} • Grupo {vehicleItem.groupId}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">R$ {vehicleItem.totalCost.toLocaleString('pt-BR')}</p>
                              <p className="text-xs text-muted-foreground">por mês</p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="p-3 border rounded-md bg-muted/5">
                                <span className="text-muted-foreground text-sm">Depreciação</span>
                                <p className="text-lg font-medium mt-1">
                                  R$ {vehicleItem.depreciationCost.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {vehicleItem.totalCost > 0 
                                    ? ((vehicleItem.depreciationCost / vehicleItem.totalCost) * 100).toFixed(1)
                                    : "0"}% do custo total
                                </p>
                              </div>
                              
                              <div className="p-3 border rounded-md bg-muted/5">
                                <span className="text-muted-foreground text-sm">Manutenção</span>
                                <p className="text-lg font-medium mt-1">
                                  R$ {vehicleItem.maintenanceCost.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {vehicleItem.totalCost > 0 
                                    ? ((vehicleItem.maintenanceCost / vehicleItem.totalCost) * 100).toFixed(1)
                                    : "0"}% do custo total
                                </p>
                              </div>
                              
                              <div className="p-3 border rounded-md bg-muted/5">
                                <span className="text-muted-foreground text-sm">KM Excedente</span>
                                <p className="text-lg font-medium mt-1">
                                  R$ {vehicleItem.extraKmRate.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">Por km adicional</p>
                              </div>
                            </div>
                            
                            {vehicleGroup && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Parâmetros do Grupo {vehicleGroup.name}</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Parâmetro</TableHead>
                                      <TableHead>Intervalo (km)</TableHead>
                                      <TableHead>Custo (R$)</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>Revisão</TableCell>
                                      <TableCell>{vehicleGroup.revisionKm.toLocaleString('pt-BR')}</TableCell>
                                      <TableCell>{vehicleGroup.revisionCost.toLocaleString('pt-BR')}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell>Troca de Pneus</TableCell>
                                      <TableCell>{vehicleGroup.tireKm.toLocaleString('pt-BR')}</TableCell>
                                      <TableCell>{vehicleGroup.tireCost.toLocaleString('pt-BR')}</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
          
          {/* Informações Adicionais */}
          <Card className="lg:col-span-3">
            <CardHeader title="Informações Adicionais" />
            <div className="p-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <div>
                  <span className="font-medium">Valor do KM Excedente</span>
                  <p className="text-xs text-muted-foreground">Cobrado caso ultrapasse a franquia mensal</p>
                </div>
                <span className="font-semibold">R$ {extraKmRate.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteDetail;
