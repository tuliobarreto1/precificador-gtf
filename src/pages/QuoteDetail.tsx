
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileEdit, Car, Calendar, User, Landmark, Gauge, Shield } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import StatusUpdater from '@/components/status/StatusUpdater';
import StatusBreadcrumb from '@/components/status/StatusBreadcrumb';
import StatusHistory from '@/components/status/StatusHistory';
import { Button } from '@/components/ui/button';
import { getQuoteByIdFromSupabase, getQuoteVehicles } from '@/integrations/supabase';
import { useToast } from '@/hooks/use-toast';
import { QuoteStatusFlow } from '@/lib/status-flow';
import { fetchStatusHistory } from '@/lib/status-api';
import { 
  calculateDepreciationSync, 
  calculateMaintenanceSync, 
  calculateExtraKmRateSync 
} from '@/lib/calculation';
import { fetchProtectionPlanDetails } from '@/integrations/supabase/services/protectionPlans';

// Interface para os dados do veículo
interface VehicleData {
  id: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    value: number;
    plate_number?: string;
    color?: string;
    is_used: boolean;
    odometer?: number;
    group_id?: string;
    fuel_type?: string;
  };
  monthly_value: number;
  contract_months: number;
  monthly_km: number;
  operation_severity: number;
  has_tracking: boolean;
  depreciation_cost?: number;
  maintenance_cost?: number;
  extra_km_rate?: number;
  total_cost?: number;
  protection_cost?: number;
  protection_plan_id?: string | null;
}

interface ProtectionPlanInfo {
  id: string;
  name: string;
  description: string | null;
  monthly_cost: number;
  type: 'basic' | 'intermediate' | 'premium';
}

const QuoteDetail = () => {
  const { id } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [protectionPlans, setProtectionPlans] = useState<Record<string, ProtectionPlanInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para calcular os custos para cada veículo
  const calculateCosts = (vehicles: VehicleData[]): VehicleData[] => {
    if (!vehicles || !Array.isArray(vehicles)) {
      console.error('Veículos inválidos para calcular custos:', vehicles);
      return [];
    }
    
    return vehicles.map(vehicle => {
      // Verificar se o objeto vehicle e vehicle.vehicle existem antes de acessar suas propriedades
      if (!vehicle || !vehicle.vehicle) {
        console.error('Dados de veículo inválidos:', vehicle);
        return vehicle; // Retornar o veículo como está para evitar erros
      }
      
      const vehicleValue = vehicle.vehicle.value || 0;
      const contractMonths = vehicle.contract_months || 12;
      const monthlyKm = vehicle.monthly_km || 2000;
      const operationSeverity = vehicle.operation_severity || 3;
      const hasTracking = vehicle.has_tracking || false;
      const vehicleGroup = vehicle.vehicle.group_id || 'A';
      
      // Calcular depreciação
      const depreciationCost = calculateDepreciationSync({
        vehicleValue,
        contractMonths,
        monthlyKm,
        operationSeverity: operationSeverity as 1|2|3|4|5|6
      });
      
      // Calcular manutenção
      const maintenanceCost = calculateMaintenanceSync({
        vehicleGroup,
        contractMonths,
        monthlyKm,
        hasTracking
      });
      
      // Calcular taxa de km excedente
      const extraKmRate = calculateExtraKmRateSync(vehicleValue);
      
      // Obter o custo de proteção do objeto original ou usar 0
      const protectionCost = vehicle.protection_cost || 0;
      
      // Calcular custo total (incluindo proteção se existir)
      const totalCost = depreciationCost + maintenanceCost + protectionCost;
      
      return {
        ...vehicle,
        depreciation_cost: depreciationCost,
        maintenance_cost: maintenanceCost,
        extra_km_rate: extraKmRate,
        protection_cost: protectionCost,
        total_cost: totalCost
      };
    });
  };

  // Função para carregar detalhes do plano de proteção
  const loadProtectionPlanDetails = async (planId: string) => {
    if (!planId || protectionPlans[planId]) return;
    
    try {
      const planDetails = await fetchProtectionPlanDetails(planId);
      if (planDetails) {
        setProtectionPlans(prev => ({
          ...prev,
          [planId]: planDetails
        }));
      }
    } catch (error) {
      console.error(`Erro ao carregar detalhes do plano de proteção ${planId}:`, error);
    }
  };

  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { success, quote: quoteData, error: quoteError } = await getQuoteByIdFromSupabase(id);
        
        if (success && quoteData) {
          console.log("Dados do orçamento carregados:", quoteData);
          setQuote(quoteData);
          
          // Buscar veículos separadamente
          console.log("Buscando veículos para o orçamento:", id);
          const { success: vehiclesSuccess, vehicles: vehiclesData, error: vehiclesError } = await getQuoteVehicles(id);
          
          if (vehiclesSuccess && vehiclesData && Array.isArray(vehiclesData)) {
            console.log("Veículos do orçamento carregados:", vehiclesData);
            
            // Verificar se algum veículo foi encontrado
            if (vehiclesData.length > 0) {
              // Calcular os custos para cada veículo
              const vehiclesWithCosts = calculateCosts(vehiclesData);
              setVehicles(vehiclesWithCosts);
              
              // Carregar informações dos planos de proteção
              for (const vehicle of vehiclesWithCosts) {
                if (vehicle.protection_plan_id) {
                  await loadProtectionPlanDetails(vehicle.protection_plan_id);
                }
              }
            } else {
              console.log("Nenhum veículo encontrado para o orçamento:", id);
              setVehicles([]);
            }
          } else {
            console.log("Nenhum veículo encontrado para o orçamento:", id);
            if (vehiclesError) {
              console.error("Erro ao buscar veículos:", vehiclesError);
            }
            setVehicles([]);
          }
          
          // Buscar histórico de status
          try {
            const historyData = await fetchStatusHistory(id);
            if (historyData) {
              setStatusHistory(historyData);
            } else {
              setStatusHistory([]);
            }
          } catch (historyError) {
            console.error("Erro ao buscar histórico de status:", historyError);
            setStatusHistory([]);
          }
        } else {
          console.error("Erro ao carregar dados do orçamento:", quoteError);
          setError("Não foi possível carregar os dados do orçamento.");
          toast({
            title: "Erro ao carregar",
            description: "Não foi possível carregar os dados do orçamento.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Erro ao carregar orçamento:", err);
        setError("Ocorreu um erro ao carregar os dados do orçamento.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [id, toast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="flex items-center space-x-2 mb-8">
            <Link to="/orcamentos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !quote) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="flex items-center space-x-2 mb-8">
            <Link to="/orcamentos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Erro ao carregar orçamento</h3>
            <p>{error || "Orçamento não encontrado"}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Obter informações do cliente com verificações de segurança
  const client = quote.client || {};
  
  // Obter status com valor padrão
  const status = quote.status_flow || 'ORCAMENTO';
  
  // Função para atualizar quando o status for alterado
  const handleStatusChange = (newStatus: QuoteStatusFlow) => {
    setQuote({...quote, status_flow: newStatus});
  };
  
  // Função para recarregar os dados quando algo for atualizado
  const handleUpdate = async () => {
    if (id) {
      try {
        const historyData = await fetchStatusHistory(id);
        setStatusHistory(historyData || []);
      } catch (error) {
        console.error("Erro ao atualizar histórico:", error);
      }
    }
  };

  // Renderizar detalhes do plano de proteção se houver
  const renderProtectionPlanInfo = (planId: string | null | undefined) => {
    if (!planId || !protectionPlans[planId]) return null;
    
    const plan = protectionPlans[planId];
    return (
      <div className="mt-2 text-sm">
        <span className="text-muted-foreground mr-1">Plano:</span>
        <span className="font-medium">{plan.name}</span>
        {plan.type && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            plan.type === 'basic' ? 'bg-blue-100 text-blue-800' : 
            plan.type === 'intermediate' ? 'bg-green-100 text-green-800' : 
            'bg-purple-100 text-purple-800'
          }`}>
            {plan.type === 'basic' ? 'Básico' : 
             plan.type === 'intermediate' ? 'Intermediário' : 
             'Premium'}
          </span>
        )}
        {plan.description && (
          <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Link to="/orcamentos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Link to={`/editar-orcamento/${id}`}>
                <Button variant="outline" size="sm">
                  <FileEdit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
            <PageTitle 
              title={`Orçamento #${id?.substring(0, 8)}`} 
              subtitle={`Cliente: ${client?.name || 'Não especificado'}`}
            />
          </div>
          
          <StatusBreadcrumb currentStatus={status as QuoteStatusFlow} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Detalhes do Orçamento" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Cliente
                    </h3>
                    <p className="mt-1">{client?.name || 'Não especificado'}</p>
                    {client?.document && <p className="text-sm text-muted-foreground">CNPJ/CPF: {client.document}</p>}
                  </div>
                  
                  {client?.email && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
                      <p className="mt-1">{client.email}</p>
                      {client?.phone && <p className="text-sm">{client.phone}</p>}
                    </div>
                  )}
                  
                  {(client?.city || client?.state) && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Localização</h3>
                      <p className="mt-1">
                        {client.city && client.state ? `${client.city} - ${client.state}` : 
                         client.city || client.state}
                      </p>
                      {client?.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Parâmetros
                    </h3>
                    <div className="mt-1 space-y-1">
                      <p>Prazo: {quote?.contract_months || 0} meses</p>
                      <p>Quilometragem: {(quote?.monthly_km || 0).toLocaleString('pt-BR')} km/mês</p>
                      <p>Severidade: Nível {quote?.operation_severity || 3}</p>
                      <p>Rastreamento: {quote?.has_tracking ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Landmark className="h-4 w-4 mr-2" />
                      Valores
                    </h3>
                    <div className="mt-1">
                      <p className="text-lg font-semibold">
                        R$ {Number(quote?.total_value || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">Valor mensal total</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Gauge className="h-4 w-4 mr-2" />
                      Datas
                    </h3>
                    <div className="mt-1 space-y-1 text-sm">
                      <p>Criado em: {quote?.created_at ? new Date(quote.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                      <p>Atualizado em: {quote?.updated_at ? new Date(quote.updated_at).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <CardHeader 
                title={`Veículos (${vehicles?.length || 0})`} 
                subtitle="Veículos incluídos neste orçamento"
                icon={<Car size={18} />}
              />
              
              <div className="p-6 space-y-4">
                {!vehicles || vehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Nenhum veículo encontrado neste orçamento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((item) => (
                      <VehicleCard 
                        key={item.id || `vehicle-${Math.random()}`} 
                        vehicle={item} 
                        showDetailedInfo={true}
                        showCosts={true}
                      >
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Valor mensal:</p>
                              <p className="font-medium">R$ {Number(item?.monthly_value || 0).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Parâmetros:</p>
                              <p className="text-sm">{item?.contract_months || 0} meses / {(item?.monthly_km || 0).toLocaleString('pt-BR')} km</p>
                            </div>
                          </div>

                          {item.protection_plan_id && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center text-sm">
                                <Shield className="h-4 w-4 mr-1 text-green-600" />
                                <span className="text-muted-foreground mr-1">Proteção:</span>
                                <span className="font-medium">
                                  R$ {Number(item?.protection_cost || 0).toLocaleString('pt-BR')}
                                </span>
                              </div>
                              {renderProtectionPlanInfo(item.protection_plan_id)}
                            </div>
                          )}
                        </div>
                      </VehicleCard>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader title="Status do Orçamento" />
              
              <div className="p-6">
                <StatusUpdater 
                  quoteId={id || ''} 
                  currentStatus={status as QuoteStatusFlow} 
                  onStatusChange={handleStatusChange}
                  onUpdate={handleUpdate}
                />
              </div>
            </Card>
            
            <StatusHistory quoteId={id} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteDetail;
