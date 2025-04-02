import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info, Users, Car, Wrench, Calculator, Plus, Trash2, Settings, Mail } from 'lucide-react';
import ClientForm from '@/components/quote/ClientForm';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { getClients } from '@/lib/data-provider';
import { Client, Vehicle, ClientType } from '@/lib/models';
import { useQuote, QuoteProvider } from '@/context/QuoteContext';
import { CustomClient } from '@/components/quote/ClientForm';
import { getAllVehicles } from '@/integrations/supabase';
import { getClientsFromSupabase } from '@/integrations/supabase/services/clients';

const STEPS = [
  { id: 'client', name: 'Cliente', icon: <Users size={18} /> },
  { id: 'vehicle', name: 'Veículos', icon: <Car size={18} /> },
  { id: 'params', name: 'Parâmetros', icon: <Wrench size={18} /> },
  { id: 'result', name: 'Resultado', icon: <Calculator size={18} /> },
];

const EmailDialog = ({ quoteId }: { quoteId: string }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { sendQuoteByEmail } = useQuote();

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "E-mail obrigatório",
        description: "Digite o e-mail do destinatário",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    const success = await sendQuoteByEmail(quoteId, email, message);
    
    if (success) {
      toast({
        title: "E-mail enviado",
        description: "Orçamento enviado com sucesso"
      });
      setDialogOpen(false);
      setEmail('');
      setMessage('');
    } else {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o orçamento por e-mail",
        variant: "destructive"
      });
    }
    setSending(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Mail size={16} />
          <span>Enviar por E-mail</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Orçamento por E-mail</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com.br"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Segue em anexo o orçamento conforme solicitado."
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSendEmail} disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QuoteForm = () => {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState('client');
  const [selectedVehicleTab, setSelectedVehicleTab] = useState<string | null | undefined>(undefined);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempted, setLoadAttempted] = useState<boolean>(false);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const loadAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    quoteForm, 
    setClient, 
    addVehicle, 
    removeVehicle,
    setGlobalContractMonths, 
    setGlobalMonthlyKm, 
    setGlobalOperationSeverity, 
    setGlobalHasTracking, 
    setUseGlobalParams,
    setVehicleParams,
    calculateQuote,
    saveQuote,
    loadQuoteForEditing,
    isEditMode,
    currentEditingQuoteId
  } = useQuote();

  const logState = () => {
    console.log("Estado atual do formulário:", {
      currentStep,
      isEditMode,
      client: quoteForm.client,
      vehicles: quoteForm.vehicles.length,
      loadingQuote,
      loadError,
      loadAttempted,
      id
    });
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        const { success, clients } = await getClientsFromSupabase();
        if (success && clients) {
          const mappedClients: Client[] = clients.map(client => ({
            id: client.id,
            name: client.name,
            type: client.document?.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ' as ClientType,
            document: client.document,
            email: client.email || undefined,
            contact: client.phone || undefined,
            responsible: client.responsible_person || undefined
          }));
          setExistingClients(mappedClients);
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    if (id && !loadAttemptedRef.current) {
      loadAttemptedRef.current = true;
      setLoadAttempted(true);
      setLoadingQuote(true);
      setLoadError(null);
      
      console.log('🔄 Tentando carregar orçamento:', id);
      
      setTimeout(() => {
        try {
          const success = loadQuoteForEditing(id);
          
          if (success) {
            console.log('✅ Orçamento carregado com sucesso');
            setCurrentStep('vehicle');
            
            toast({
              title: "Orçamento carregado",
              description: "Os dados do orçamento foram carregados para edição."
            });
          } else {
            console.error('❌ Falha ao carregar orçamento:', id);
            setLoadError("Não foi possível carregar o orçamento para edição.");
            
            toast({
              title: "Erro ao carregar",
              description: "Não foi possível carregar o orçamento para edição.",
              variant: "destructive"
            });
          }
          
          setLoadingQuote(false);
        } catch (error) {
          console.error('❌ Erro ao processar orçamento:', error);
          setLoadError("Ocorreu um erro ao tentar carregar o orçamento.");
          
          toast({
            title: "Erro inesperado",
            description: "Ocorreu um erro ao tentar carregar o orçamento.",
            variant: "destructive"
          });
          
          setLoadingQuote(false);
        }
      }, 1000);
    }
  }, [id, loadQuoteForEditing, toast]);

  useEffect(() => {
    if (currentStep === 'params' && quoteForm.vehicles.length > 0) {
      if (!selectedVehicleTab) {
        setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
      } else {
        const vehicleStillExists = quoteForm.vehicles.some(v => v.vehicle.id === selectedVehicleTab);
        if (!vehicleStillExists && quoteForm.vehicles.length > 0) {
          setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
        }
      }
    }
  }, [currentStep, quoteForm.vehicles, selectedVehicleTab]);

  const handleNextStep = () => {
    logState();
    console.log(`👆 Botão CONTINUAR clicado: avançando de ${currentStep} para o próximo passo.`);
    
    if (currentStep === 'client') {
      if (!quoteForm.client) {
        toast({
          title: "Selecione um cliente",
          description: "É necessário selecionar um cliente para continuar."
        });
        return;
      }
      console.log("✅ Avançando para etapa de veículo");
      setCurrentStep('vehicle');
      return;
    }
    
    if (currentStep === 'vehicle') {
      if (quoteForm.vehicles.length === 0) {
        toast({
          title: "Selecione pelo menos um veículo",
          description: "É necessário selecionar pelo menos um veículo para continuar."
        });
        return;
      }
      console.log("✅ Avançando para etapa de parâmetros");
      setCurrentStep('params');
      
      if (quoteForm.vehicles.length > 0) {
        setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
      }
      return;
    }
    
    if (currentStep === 'params') {
      console.log("✅ Avançando para etapa de resultado");
      setCurrentStep('result');
      return;
    }
    
    if (currentStep === 'result') {
      console.log("✅ Finalizando orçamento");
      const success = saveQuote();
      if (success) {
        toast({
          title: isEditMode ? "Orçamento atualizado" : "Orçamento salvo",
          description: isEditMode 
            ? "Seu orçamento foi atualizado com sucesso." 
            : "Seu orçamento foi salvo com sucesso."
        });
        navigate('/orcamentos');
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Houve um problema ao salvar o orçamento.",
          variant: "destructive"
        });
      }
      return;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'vehicle':
        setCurrentStep('client');
        break;
      case 'params':
        setCurrentStep('vehicle');
        break;
      case 'result':
        setCurrentStep('params');
        break;
    }
  };

  const handleClientSelect = (client: Client | CustomClient) => {
    console.log("Cliente selecionado:", client);
    setClient(client);
  };

  const renderClientStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <ClientForm 
        onClientSelect={handleClientSelect} 
        existingClients={existingClients}
      />
    </div>
  );

  const renderVehicleStep = () => (
    <VehicleSelector 
      onSelectVehicle={addVehicle}
      selectedVehicles={quoteForm.vehicles.map(item => item.vehicle)}
      onRemoveVehicle={removeVehicle}
    />
  );

  const renderVehicleParams = (vehicleId: string) => {
    const vehicleItem = quoteForm.vehicles.find(v => v.vehicle.id === vehicleId);
    if (!vehicleItem) return null;
    
    const params = vehicleItem.params || quoteForm.globalParams;
    
    return (
      <div className="space-y-6 p-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">{vehicleItem.vehicle.brand} {vehicleItem.vehicle.model}</h3>
          {vehicleItem.vehicle.plateNumber && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {vehicleItem.vehicle.plateNumber}
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          <Label className="text-sm">Prazo do Contrato</Label>
          <div className="space-y-3">
            <Slider
              value={[params.contractMonths]}
              min={6}
              max={24}
              step={1}
              onValueChange={(value) => setVehicleParams(vehicleId, { contractMonths: value[0] })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6 meses</span>
              <span>{params.contractMonths} meses</span>
              <span>24 meses</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <Label className="text-sm">Quilometragem Mensal</Label>
          <div className="space-y-3">
            <Slider
              value={[params.monthlyKm]}
              min={1000}
              max={5000}
              step={100}
              onValueChange={(value) => setVehicleParams(vehicleId, { monthlyKm: value[0] })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1.000 km</span>
              <span>{params.monthlyKm.toLocaleString('pt-BR')} km</span>
              <span>5.000 km</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <Label className="text-sm">Severidade de Operação</Label>
          <RadioGroup 
            value={params.operationSeverity.toString()} 
            onValueChange={(value) => setVehicleParams(vehicleId, { operationSeverity: parseInt(value) as 1|2|3|4|5|6 })}
            className="grid grid-cols-3 gap-2"
          >
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <RadioGroupItem value={level.toString()} id={`severity-${vehicleId}-${level}`} />
                <Label htmlFor={`severity-${vehicleId}-${level}`} className="text-xs cursor-pointer">
                  Nível {level}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id={`tracking-${vehicleId}`} 
            checked={params.hasTracking}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { hasTracking: checked })}
          />
          <Label htmlFor={`tracking-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir rastreamento
          </Label>
        </div>
      </div>
    );
  };

  const renderParamsStep = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-primary/5 border p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">Parâmetros da Cotação</h3>
          <div className="flex items-center space-x-2">
            <Switch 
              id="global-params"
              checked={quoteForm.useGlobalParams}
              onCheckedChange={setUseGlobalParams}
            />
            <Label htmlFor="global-params">Usar parâmetros globais</Label>
          </div>
        </div>
        
        {quoteForm.useGlobalParams ? (
          <p className="text-sm text-muted-foreground">
            Os mesmos parâmetros serão aplicados a todos os veículos desta cotação.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cada veículo terá seus próprios parâmetros configuráveis.
          </p>
        )}
      </div>

      {quoteForm.useGlobalParams ? (
        <div className="space-y-4">
          <div className="space-y-4">
            <Label className="text-base">Prazo do Contrato</Label>
            <div className="space-y-3">
              <Slider
                value={[quoteForm.globalParams.contractMonths]}
                min={6}
                max={24}
                step={1}
                onValueChange={(value) => setGlobalContractMonths(value[0])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>6 meses</span>
                <span>{quoteForm.globalParams.contractMonths} meses</span>
                <span>24 meses</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-base">Quilometragem Mensal</Label>
            <div className="space-y-3">
              <Slider
                value={[quoteForm.globalParams.monthlyKm]}
                min={1000}
                max={5000}
                step={100}
                onValueChange={(value) => setGlobalMonthlyKm(value[0])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1.000 km</span>
                <span>{quoteForm.globalParams.monthlyKm.toLocaleString('pt-BR')} km</span>
                <span>5.000 km</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-base">Severidade de Operação</Label>
            <RadioGroup 
              value={quoteForm.globalParams.operationSeverity.toString()} 
              onValueChange={(value) => setGlobalOperationSeverity(parseInt(value) as 1|2|3|4|5|6)}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <RadioGroupItem value={level.toString()} id={`severity-${level}`} />
                  <Label htmlFor={`severity-${level}`} className="cursor-pointer">
                    Nível {level}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-sm text-muted-foreground flex items-center space-x-1">
              <Info size={14} className="inline-block mr-1" />
              <span>Quanto maior o nível, mais severo é o uso do veículo.</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="tracking" 
              checked={quoteForm.globalParams.hasTracking}
              onCheckedChange={setGlobalHasTracking}
            />
            <Label htmlFor="tracking" className="cursor-pointer">Incluir rastreamento</Label>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-medium">Parâmetros por Veículo</h3>
          {quoteForm.vehicles.length > 0 && (
            <Tabs 
              value={selectedVehicleTab || quoteForm.vehicles[0].vehicle.id}
              onValueChange={setSelectedVehicleTab}
              defaultValue={selectedVehicleTab || quoteForm.vehicles[0].vehicle.id}
            >
              <TabsList className="mb-4 flex overflow-x-auto pb-1">
                {quoteForm.vehicles.map(item => (
                  <TabsTrigger 
                    key={item.vehicle.id} 
                    value={item.vehicle.id}
                    className="whitespace-nowrap"
                  >
                    <Car className="h-4 w-4 mr-1" />
                    {item.vehicle.brand} {item.vehicle.model} 
                    {item.vehicle.plateNumber && ` (${item.vehicle.plateNumber})`}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {quoteForm.vehicles.map(item => (
                <TabsContent 
                  key={item.vehicle.id} 
                  value={item.vehicle.id}
                  className="mt-4"
                >
                  {renderVehicleParams(item.vehicle.id)}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );

  const renderResultStep = () => {
    const result = calculateQuote();
    if (!result) return <div>Não foi possível calcular o orçamento.</div>;
    
    const { vehicleResults, totalCost } = result;
    
    return (
      <div className="space-y-8 animate-fadeIn">
        <Card>
          <CardHeader title={`Resumo do Orçamento - ${quoteForm.vehicles.length} veículo(s)`} />
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{quoteForm.client?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="font-medium">{quoteForm.globalParams.contractMonths} meses</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quilometragem</p>
                <p className="font-medium">{quoteForm.globalParams.monthlyKm.toLocaleString('pt-BR')} km/mês</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Severidade</p>
                <p className="font-medium">Nível {quoteForm.globalParams.operationSeverity}</p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Veículos Cotados</h3>
              <div className="space-y-4">
                {vehicleResults.map((result, index) => {
                  const vehicleItem = quoteForm.vehicles.find(v => v.vehicle.id === result.vehicleId);
                  if (!vehicleItem) return null;
                  
                  const params = quoteForm.useGlobalParams 
                    ? quoteForm.globalParams 
                    : (vehicleItem.params || quoteForm.globalParams);
                  
                  return (
                    <div key={vehicleItem.vehicle.id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{vehicleItem.vehicle.brand} {vehicleItem.vehicle.model}</h4>
                          <p className="text-sm text-muted-foreground">
                            {vehicleItem.vehicle.plateNumber ? `Placa: ${vehicleItem.vehicle.plateNumber} • ` : ''}
                            Grupo: {vehicleItem.vehicleGroup.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {result.totalCost.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-muted-foreground">Valor mensal</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="text-sm">
                          <p className="text-muted-foreground">Depreciação:</p>
                          <p className="font-medium">R$ {result.depreciationCost.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Manutenção:</p>
                          <p className="font-medium">R$ {result.maintenanceCost.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Km excedente:</p>
                          <p className="font-medium">R$ {result.extraKmRate.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {!quoteForm.useGlobalParams && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Prazo:</p>
                            <p>{params.contractMonths} meses</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quilometragem:</p>
                            <p>{params.monthlyKm.toLocaleString('pt-BR')} km/mês</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Severidade:</p>
                            <p>Nível {params.operationSeverity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rastreamento:</p>
                            <p>{params.hasTracking ? 'Sim' : 'Não'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row justify-between items-center p-6">
            <div>
              <h3 className="text-2xl font-semibold">Valor Total Mensal</h3>
              <p className="text-muted-foreground">Todos os impostos inclusos</p>
            </div>
            <div className="mt-4 md:mt-0 text-center md:text-right">
              <p className="text-3xl font-bold text-primary">
                R$ {totalCost.toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">
                {quoteForm.vehicles.length} veículo(s)
              </p>
            </div>
          </div>
          
          {isEditMode && currentEditingQuoteId && (
            <div className="border-t p-4 flex justify-end">
              <EmailDialog quoteId={currentEditingQuoteId} />
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'client':
        return renderClientStep();
      case 'vehicle':
        return renderVehicleStep();
      case 'params':
        return renderParamsStep();
      case 'result':
        return renderResultStep();
      default:
        return null;
    }
  };

  const loadExistingVehicles = async () => {
    try {
      setLoadingVehicles(true);
      
      const { vehicles, success } = await getAllVehicles();
      
      if (success && vehicles && vehicles.length > 0) {
        console.log('Veículos carregados com sucesso:', vehicles);
        setAvailableVehicles(vehicles);
      } else {
        console.log('Nenhum veículo encontrado ou erro ao carregar veículos');
      }
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de veículos",
        variant: "destructive"
      });
    } finally {
      setLoadingVehicles(false);
    }
  };

  return (
    <div className="space-y-8">
      {loadingQuote ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando orçamento...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="bg-destructive/80 text-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Erro ao carregar</h3>
          <p>{loadError}</p>
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={() => navigate('/orcamentos')}
            >
              Voltar para a lista de orçamentos
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between bg-muted/30 p-1 rounded-lg">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 first:flex-none last:flex-none">
                {index > 0 && (
                  <div className="h-[2px] flex-1 bg-border" />
                )}
                <div 
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 ${
                    currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="hidden md:inline">{step.name}</span>
                  
                  {step.id === 'vehicle' && quoteForm.vehicles.length > 0 && (
                    <span className="text-xs bg-secondary rounded-full px-1.5 py-0.5 min-w-5 flex items-center justify-center">
                      {quoteForm.vehicles.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>
          
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 'client'}
            >
              Voltar
            </Button>
            <Button 
              onClick={handleNextStep}
              type="button"
              className="min-w-28 font-medium"
            >
              {currentStep === 'result' 
                ? (isEditMode ? "Atualizar Orçamento" : "Salvar Orçamento") 
                : "Continuar"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const NewQuote = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle 
          title={id ? "Editar Orçamento" : "Novo Orçamento"} 
          subtitle={id 
            ? "Atualize os dados do orçamento existente" 
            : "Preencha os dados para gerar um novo orçamento de locação"
          } 
        />
        
        <Card>
          <QuoteProvider>
            <QuoteForm />
          </QuoteProvider>
        </Card>
      </div>
    </MainLayout>
  );
};

export default NewQuote;
