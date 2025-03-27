
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, Edit, Trash, Car, Clock, FileEdit } from 'lucide-react';
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
import { SavedQuote, useQuote, EditRecord } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';

// Função para verificar se é um orçamento salvo
const isSavedQuote = (quote: any): quote is SavedQuote => {
  return 'clientName' in quote && 'vehicleBrand' in quote && 'vehicleModel' in quote;
};

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [vehicleGroup, setVehicleGroup] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const { savedQuotes, deleteQuote, canEditQuote, canDeleteQuote, getCurrentUser } = useQuote();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Buscar orçamento inicialmente
  useEffect(() => {
    if (!id) return;
    
    // Buscar nos orçamentos mockados
    const mockQuote = quotes.find(q => q.id === id);
    if (mockQuote) {
      setQuote(mockQuote);
      return;
    }
    
    // Se não encontrar, buscar nos salvos
    const savedQuote = savedQuotes.find(q => q.id === id);
    if (savedQuote) {
      setQuote(savedQuote);
    }
  }, [id, savedQuotes]);
  
  // Processar o orçamento encontrado
  useEffect(() => {
    if (!quote) return;
    
    // Definir se é um orçamento salvo
    const quoteIsSaved = isSavedQuote(quote);
    setIsSaved(quoteIsSaved);
    
    let clientData, vehicleGroupData, vehiclesData;
    
    if (quoteIsSaved) {
      // Para orçamentos salvos, usar os dados do próprio objeto
      clientData = {
        name: quote.clientName,
        document: '', // Podemos não ter essa informação no SavedQuote
        type: 'PJ', // Valor padrão, pode não ser preciso
        email: ''
      };
      
      // Para orçamentos salvos, listar todos os veículos disponíveis
      vehiclesData = quote.vehicles;
      
      if (vehiclesData.length > 0) {
        // Obter o grupo do veículo do primeiro veículo
        vehicleGroupData = getVehicleGroupById(vehiclesData[0].groupId);
      }
    } else {
      // Para orçamentos mockados, buscar dados relacionados
      clientData = getClientById(quote.clientId);
      const vehicle = getVehicleById(quote.vehicleId);
      
      if (vehicle) {
        vehiclesData = [
          {
            vehicleId: vehicle.id,
            vehicleBrand: vehicle.brand,
            vehicleModel: vehicle.model,
            plateNumber: vehicle.plateNumber || '',
            groupId: vehicle.groupId,
            totalCost: quote.totalCost,
            depreciationCost: quote.depreciationCost,
            maintenanceCost: quote.maintenanceCost,
            extraKmRate: calculateExtraKmRate(vehicle.value)
          }
        ];
        vehicleGroupData = getVehicleGroupById(vehicle.groupId);
      }
    }
    
    setClient(clientData);
    setVehicleGroup(vehicleGroupData);
    setVehicles(vehiclesData || []);
    
    // Selecionar o primeiro veículo por padrão se não houver selecionado
    if (vehiclesData && vehiclesData.length > 0) {
      if (!selectedVehicleId) {
        setSelectedVehicleId(vehiclesData[0].vehicleId);
        setSelectedVehicle(vehiclesData[0]);
      } else {
        const selected = vehiclesData.find(v => v.vehicleId === selectedVehicleId);
        setSelectedVehicle(selected || vehiclesData[0]);
      }
    }
  }, [quote, selectedVehicleId]);
  
  // Atualizar veículo selecionado quando a ID selecionada mudar
  useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleId) {
      const selected = vehicles.find(v => v.vehicleId === selectedVehicleId);
      setSelectedVehicle(selected || vehicles[0]);
    }
  }, [selectedVehicleId, vehicles]);
  
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
  
  // Função para lidar com a mudança de veículo selecionado
  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  // Função para lidar com a exclusão
  const handleDelete = () => {
    if (isSaved) {
      if (deleteQuote(quote.id)) {
        toast({
          title: "Orçamento excluído",
          description: "Orçamento excluído com sucesso.",
          variant: "default",
        });
        navigate('/orcamentos');
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Você não tem permissão para excluir este orçamento.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Operação inválida",
        description: "Não é possível excluir orçamentos de demonstração.",
        variant: "destructive",
      });
    }
  };

  // Verificar permissões para edição e exclusão - com verificações adicionais de segurança
  const canEdit = isSaved && quote ? canEditQuote(quote as SavedQuote) : false;
  const canDelete = isSaved && quote ? canDeleteQuote(quote as SavedQuote) : false;
  
  // Obter parâmetros globais
  const globalParams = getGlobalParams();
  
  // Calcular dados adicionais
  const extraKmRate = selectedVehicle ? selectedVehicle.extraKmRate : 0;
  const createdDate = new Date(quote.createdAt).toLocaleDateString('pt-BR');
  const totalKm = quote.monthlyKm * quote.contractMonths;
  
  // Calcular custos específicos com base no veículo selecionado
  const depreciationCost = selectedVehicle ? selectedVehicle.depreciationCost : 0;
  const maintenanceCost = selectedVehicle ? selectedVehicle.maintenanceCost : 0;
  const trackingCost = !isSaved && quote.trackingCost ? quote.trackingCost : 0;
  const vehicleTotalCost = selectedVehicle ? selectedVehicle.totalCost : 0;
  
  // Cálculo do custo por km
  const costPerKm = totalKm > 0 ? (selectedVehicle ? selectedVehicle.totalCost / totalKm : 0) : 0;

  // Cálculo das porcentagens dos componentes de custo
  const depreciationPercentage = vehicleTotalCost > 0 ? ((depreciationCost / vehicleTotalCost) * 100).toFixed(1) : "0";
  const maintenancePercentage = vehicleTotalCost > 0 ? ((maintenanceCost / vehicleTotalCost) * 100).toFixed(1) : "0";
  const trackingPercentage = vehicleTotalCost > 0 ? ((trackingCost / vehicleTotalCost) * 100).toFixed(1) : "0";
  
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
            {isSaved && quote.createdBy && (
              <Badge variant="outline" className="ml-2">
                Criado por: {quote.createdBy.name}
              </Badge>
            )}
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
            {canEdit && (
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4" />
                Excluir
              </Button>
            )}
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Veículo</h3>
                  
                  {/* Seletor de veículos para orçamentos com múltiplos veículos */}
                  {vehicles.length > 1 && (
                    <div className="w-48">
                      {selectedVehicleId && (
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedVehicleId}
                            onChange={(e) => handleVehicleChange(e.target.value)}
                            className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                          >
                            {vehicles.map((v) => (
                              <option key={v.vehicleId} value={v.vehicleId}>
                                {v.vehicleBrand} {v.vehicleModel}
                              </option>
                            ))}
                          </select>
                          <Car className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedVehicle && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Modelo</span>
                      <span className="font-medium">
                        {selectedVehicle.vehicleBrand} {selectedVehicle.vehicleModel}
                      </span>
                    </div>
                    {selectedVehicle.plateNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Placa</span>
                        <span>{selectedVehicle.plateNumber}</span>
                      </div>
                    )}
                    {vehicleGroup && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Grupo</span>
                        <Badge variant="outline">{vehicleGroup.name}</Badge>
                      </div>
                    )}
                    {vehicles.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total de Veículos</span>
                        <span>{vehicles.length}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Resumo */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader title="Valor Total" />
            <div className="p-4 space-y-4">
              <div className="text-center">
                {vehicles.length > 1 ? (
                  <>
                    <p className="text-3xl font-bold text-primary">
                      R$ {quote.totalCost.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      total por mês (todos os veículos)
                    </p>
                    <div className="mt-2 p-2 bg-white rounded-md">
                      <p className="text-xl font-semibold text-primary">
                        R$ {vehicleTotalCost.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedVehicle ? `${selectedVehicle.vehicleBrand} ${selectedVehicle.vehicleModel}` : 'Veículo selecionado'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-primary">
                      R$ {vehicleTotalCost.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      por mês
                    </p>
                  </>
                )}
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
                {!isSaved && quote.operationSeverity !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nível de Operação</span>
                    <span className="font-medium">{quote.operationSeverity}</span>
                  </div>
                )}
                {!isSaved && quote.hasTracking !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rastreamento</span>
                    <span className="font-medium">{quote.hasTracking ? 'Sim' : 'Não'}</span>
                  </div>
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
                  
                  {trackingCost > 0 && (
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
          
          {/* Histórico de Edições - Apenas para orçamentos salvos com histórico */}
          {isSaved && quote.editHistory && quote.editHistory.length > 0 && (
            <Card className="lg:col-span-3">
              <CardHeader 
                title="Histórico de Edições" 
                icon={<Clock className="h-5 w-5" />} 
              />
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Alterações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.editHistory.map((edit: EditRecord, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(edit.editedAt).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{edit.editedBy.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {edit.editedBy.role === 'admin' ? 'Administrador' : 
                             edit.editedBy.role === 'manager' ? 'Gerente' : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>{edit.changes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteDetail;
