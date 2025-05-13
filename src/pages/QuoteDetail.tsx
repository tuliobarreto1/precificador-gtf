
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { SavedQuote, QuoteVehicleItem } from '@/context/types/quoteTypes';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getQuoteByIdFromSupabase } from '@/integrations/supabase/services/quotes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailDialog } from '@/components/quote/EmailDialog';
import StatusUpdater from '@/components/status/StatusUpdater';
import StatusBadge from '@/components/status/StatusBadge';
import StatusBreadcrumb from '@/components/status/StatusBreadcrumb';
import StatusProgressBar from '@/components/status/StatusProgressBar';
import StatusHistory from '@/components/status/StatusHistory';
import ProposalHistory from '@/components/quote/ProposalHistory';
import GerarPropostaButton from '@/components/quote/GerarPropostaButton';
import { updateQuoteStatus } from '@/lib/status-api';
import { useQuoteCalculation } from '@/hooks/useQuoteCalculation';
import { useToast } from '@/hooks/use-toast';
import { QuoteStatusFlow, DbQuoteStatus, toDbStatus } from '@/lib/status-flow';
import { Skeleton } from '@/components/ui/skeleton';

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  const { calculateQuoteSync } = useQuoteCalculation({
    client: null,
    vehicles: [],
    useGlobalParams: true,
    globalParams: {
      contractMonths: 24,
      monthlyKm: 3000,
      operationSeverity: 3 as 1|2|3|4|5|6,
      hasTracking: false,
      protectionPlanId: null,
      includeIpva: false,
      includeLicensing: false,
      includeTaxes: false
    }
  });

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError("ID do orçamento não fornecido");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Buscando orçamento com ID:', id);
        
        const { success, quote: fetchedQuote, error } = await getQuoteByIdFromSupabase(id);
        
        if (success && fetchedQuote) {
          console.log('Orçamento encontrado:', fetchedQuote);
          // Garantir que status seja um QuoteStatusFlow válido ou usar 'ORCAMENTO' como fallback
          const safeQuote = {
            ...fetchedQuote,
            status: (fetchedQuote.status as QuoteStatusFlow) || 'ORCAMENTO'
          };
          setQuote(safeQuote);
        } else {
          console.error('Erro ao buscar orçamento:', error);
          setError(error || "Não foi possível carregar os detalhes do orçamento.");
          toast({
            title: "Erro ao carregar orçamento",
            description: error || "Não foi possível carregar os detalhes do orçamento.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        setError("Ocorreu um erro inesperado ao buscar o orçamento.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
  }, [id, toast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
          
          <div className="space-y-3 mt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !quote) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold mb-2">
            {error ? "Erro ao carregar orçamento" : "Orçamento não encontrado"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "O orçamento solicitado não foi encontrado ou foi excluído."}
          </p>
          <Button onClick={() => navigate('/orcamentos')}>Voltar para Lista</Button>
        </div>
      </MainLayout>
    );
  }

  // Função para garantir que o status seja um QuoteStatusFlow válido
  const getQuoteStatus = (): QuoteStatusFlow => {
    if (!quote.status) return 'ORCAMENTO';
    
    // Verificar se o status é um valor válido de QuoteStatusFlow
    if (["ORCAMENTO", "PROPOSTA_GERADA", "EM_VERIFICACAO", "APROVADA", 
         "CONTRATO_GERADO", "ASSINATURA_CLIENTE", "ASSINATURA_DIRETORIA", 
         "AGENDAMENTO_ENTREGA", "ENTREGA", "CONCLUIDO", "draft"].includes(quote.status)) {
      return quote.status as QuoteStatusFlow;
    }
    
    // Fallback para ORCAMENTO se não for um valor válido
    return 'ORCAMENTO';
  };

  const currentStatus = getQuoteStatus();

  // Preparar dados para o GerarPropostaButton
  const quoteFormData = {
    client: {
      id: quote.clientId || '',
      name: quote.clientName,
      document: quote.clientId || '' // Usando clientId como substituto já que clientDocument não existe
    },
    vehicles: quote.vehicles.map(v => ({
      vehicle: {
        id: v.vehicleId,
        brand: v.vehicleBrand,
        model: v.vehicleModel,
        plateNumber: v.plateNumber || '',
        value: v.vehicleValue || 0,
        year: new Date().getFullYear()
      },
      vehicleGroup: {
        id: v.vehicleGroupId || v.groupId || 'A',
        name: 'Grupo ' + (v.vehicleGroupId || v.groupId || 'A')
      },
      params: null
    })),
    useGlobalParams: true,
    globalParams: {
      contractMonths: quote.contractMonths || 24,
      monthlyKm: quote.monthlyKm || 3000,
      operationSeverity: (quote.operationSeverity || 3) as 1|2|3|4|5|6,
      hasTracking: quote.hasTracking || false,
      protectionPlanId: null,
      includeIpva: quote.includeIpva || false,
      includeLicensing: quote.includeLicensing || false,
      includeTaxes: quote.includeTaxes || false
    }
  };
  
  // Recalcular resultado
  const calculationResult = calculateQuoteSync();
  
  // Organizar os veículos em grupos para exibição
  const vehiclesByGroup: Record<string, Array<any>> = {};
  
  if (Array.isArray(quote.vehicles)) {
    quote.vehicles.forEach(vehicle => {
      const groupId = vehicle.vehicleGroupId || vehicle.groupId || 'N/A';
      
      if (!vehiclesByGroup[groupId]) {
        vehiclesByGroup[groupId] = [];
      }
      
      vehiclesByGroup[groupId].push({
        ...vehicle,
        totalCostFormatted: formatCurrency(vehicle.totalCost || 0)
      });
    });
  } else {
    console.error('quote.vehicles não é um array:', quote.vehicles);
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <MainLayout>
      <PageTitle
        title={`Detalhes do Orçamento: ${quote.clientName}`}
        breadcrumbs={[
          { label: 'Home', url: '/' },
          { label: 'Orçamentos', url: '/orcamentos' },
          { label: quote.clientName, url: `/orcamento/${quote.id}` }
        ]}
      />
      
      {/* Status e detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{quote.clientName}</h2>
                <p className="text-sm text-muted-foreground">
                  Criado em {formatDate(quote.createdAt)}
                  {quote.createdBy?.name && ` por ${quote.createdBy.name}`}
                </p>
              </div>
              
              <div className="mt-2 md:mt-0">
                <StatusBadge status={currentStatus} size="lg" />
              </div>
            </div>
            
            <div className="mt-4">
              <StatusBreadcrumb currentStatus={currentStatus} />
              <div className="mt-3">
                <StatusProgressBar currentStatus={currentStatus} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resumo do Orçamento</h3>
              <p className="font-semibold text-lg text-primary">{formatCurrency(quote.totalValue)}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Veículos</p>
                <p className="font-medium">{Array.isArray(quote.vehicles) ? quote.vehicles.length : 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="font-medium">{quote.contractMonths || quote.globalParams?.contractMonths || 24} meses</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quilometragem</p>
                <p className="font-medium">{quote.monthlyKm || quote.globalParams?.monthlyKm || 3000} km/mês</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Severidade</p>
                <p className="font-medium">Nível {quote.operationSeverity || quote.globalParams?.operationSeverity || 3}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Ações</h3>
          
          <div className="space-y-3">
            <GerarPropostaButton 
              quoteForm={quoteFormData}
              result={calculationResult} 
              currentQuoteId={quote.id}
            />
            
            <EmailDialog quoteId={quote.id} />
            
            <StatusUpdater 
              quoteId={quote.id} 
              currentStatus={currentStatus}
              onStatusChange={(newStatus) => {
                setQuote(prev => prev ? { ...prev, status: newStatus } : null);
              }}
            />
            
            <Button variant="outline" className="w-full" onClick={() => navigate(`/orcamento/editar/${quote.id}`)}>
              Editar Orçamento
            </Button>
          </div>
          
          <div className="mt-8">
            <h4 className="text-sm font-medium mb-2">Informações Adicionais</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{quote.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de criação:</span>
                <span>{formatDate(quote.createdAt)}</span>
              </div>
              {quote.includeIpva !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IPVA:</span>
                  <span>{quote.includeIpva ? 'Incluído' : 'Não incluído'}</span>
                </div>
              )}
              {quote.includeLicensing !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Licenciamento:</span>
                  <span>{quote.includeLicensing ? 'Incluído' : 'Não incluído'}</span>
                </div>
              )}
              {quote.includeTaxes !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custos Financeiros:</span>
                  <span>{quote.includeTaxes ? 'Incluídos' : 'Não incluídos'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Abas com detalhes */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="status">Histórico de Status</TabsTrigger>
          <TabsTrigger value="proposals">Propostas Geradas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 pt-4">
          {Object.keys(vehiclesByGroup).length === 0 ? (
            <div className="bg-white border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Nenhum veículo encontrado para este orçamento.</p>
            </div>
          ) : (
            Object.entries(vehiclesByGroup).map(([groupId, vehicles]) => (
              <div key={groupId} className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Grupo {groupId}</h3>
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border rounded p-4 bg-muted/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{vehicle.vehicleBrand} {vehicle.vehicleModel}</h4>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.plateNumber && `Placa: ${vehicle.plateNumber} • `}
                            Grupo: {groupId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{vehicle.totalCostFormatted}</p>
                          <p className="text-xs text-muted-foreground">Valor mensal</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="status" className="pt-4">
          <StatusHistory quoteId={quote.id} />
        </TabsContent>
        
        <TabsContent value="proposals" className="pt-4">
          <ProposalHistory quoteId={quote.id} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default QuoteDetail;
