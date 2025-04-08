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
import ProtectionPlanSelector from '@/components/protection/ProtectionPlanSelector';
import ProtectionDetails from '@/components/protection/ProtectionDetails';
import { formatCurrency } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTaxIndices } from '@/hooks/useTaxIndices';

const STEPS = [
  { id: 'client', name: 'Cliente', icon: <Users size={18} /> },
  { id: 'vehicle', name: 'Veículos', icon: <Car size={18} /> },
  { id: 'params', name: 'Parâmetros', icon: <Wrench size={18} /> },
  { id: 'result', name: 'Resultado', icon: <Calculator size={18} /> },
];

const KM_OPTIONS = [1000, 2000, 3000, 4000, 5000];

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
  const { getTaxBreakdown } = useTaxIndices();
  
  const emptyQuoteForm = {
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
      includeTaxes: false,
    }
  };
  
  const quoteContext = useQuote();
  
  const { 
    quoteForm = emptyQuoteForm, 
    setClient = () => {}, 
    addVehicle = () => {},
    removeVehicle = () => {},
    setGlobalContractMonths = () => {}, 
    setGlobalMonthlyKm = () => {}, 
    setGlobalOperationSeverity = () => {}, 
    setGlobalHasTracking = () => {},
    setGlobalProtectionPlanId = () => {},
    setGlobalIncludeIpva = () => {}, 
    setGlobalIncludeLicensing = () => {},
    setGlobalIncludeTaxes = () => {},
    setUseGlobalParams = () => {},
    setVehicleParams = () => {},
    calculateQuote = () => null,
    saveQuote = () => false,
    loadQuoteForEditing = () => false,
    isEditMode = false,
    currentEditingQuoteId = null
  } = quoteContext || {};

  const logState = () => {
    console.log("Estado atual do formulário:", {
      currentStep,
      isEditMode,
      client: quoteForm?.client,
      vehicles: quoteForm?.vehicles?.length,
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
      
      setTimeout(async () => {
        try {
          const success = await loadQuoteForEditing(id);
          
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
    if (currentStep === 'params' && quoteForm?.vehicles && quoteForm.vehicles.length > 0) {
      if (!selectedVehicleTab) {
        setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
      } else {
        const vehicleStillExists = quoteForm.vehicles.some(v => v.vehicle.id === selectedVehicleTab);
        if (!vehicleStillExists && quoteForm.vehicles.length > 0) {
          setSelectedVehicleTab(quoteForm.vehicles[0].vehicle.id);
        }
      }
    }
  }, [currentStep, quoteForm?.vehicles, selectedVehicleTab]);

  const handleNextStep = async () => {
    logState();
    console.log(`👆 Botão CONTINUAR clicado: avançando de ${currentStep} para o próximo passo.`);
    
    if (currentStep === 'client') {
      if (!quoteForm?.client) {
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
      if (!quoteForm?.vehicles || quoteForm.vehicles.length === 0) {
        toast({
          title: "Selecione pelo menos um veículo",
          description: "É necessário selecionar pelo menos um veículo para continuar."
        });
        return;
      }
      console.log("✅ Avançando para etapa de parâmetros");
      setCurrentStep('params');
      
      if (quoteForm?.vehicles && quoteForm.vehicles.length > 0) {
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
      try {
        const success = await saveQuote();
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
      } catch (error) {
        console.error("Erro ao salvar orçamento:", error);
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
    if (client) {
      setClient(client);
    }
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
      selectedVehicles={quoteForm?.vehicles ? quoteForm.vehicles.map(item => item.vehicle) : []}
      onRemoveVehicle={removeVehicle}
    />
  );

  const renderVehicleParams = (vehicleId: string) => {
    if (!quoteForm?.vehicles) return null;
    
    const vehicleItem = quoteForm.vehicles.find(v => v.vehicle.id === vehicleId);
    if (!vehicleItem) return null;
    
    const params = vehicleItem.params || (quoteForm.globalParams || {
      contractMonths: 24,
      monthlyKm: 3000,
      operationSeverity: 3 as 1|2|3|4|5|6,
      hasTracking: false,
      protectionPlanId: null,
      includeIpva: false,
      includeLicensing: false,
      includeTaxes: false,
    });
    
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
        
        <div className="space-y-3">
          <Label className="text-sm">Prazo do Contrato</Label>
          <div className="space-y-3">
            <Slider
              value={[params.contractMonths]}
              min={6}
              max={24}
              step={1}
              onValueChange={(value) => setVehicleParams(vehicleId, { 
                contractMonths: value[0],
                monthlyKm: params.monthlyKm,
                operationSeverity: params.operationSeverity,
                hasTracking: params.hasTracking,
                protectionPlanId: params.protectionPlanId,
                includeIpva: params.includeIpva,
                includeLicensing: params.includeLicensing,
                includeTaxes: params.includeTaxes
              })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6 meses</span>
              <span>{params.contractMonths} meses</span>
              <span>24 meses</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm">Quilometragem Mensal</Label>
          <div className="grid grid-cols-5 gap-2">
            {KM_OPTIONS.map((km) => (
              <Button 
                key={`${vehicleId}-km-${km}`}
                type="button"
                variant={params.monthlyKm === km ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setVehicleParams(vehicleId, { 
                  contractMonths: params.contractMonths,
                  monthlyKm: km,
                  operationSeverity: params.operationSeverity,
                  hasTracking: params.hasTracking,
                  protectionPlanId: params.protectionPlanId,
                  includeIpva: params.includeIpva,
                  includeLicensing: params.includeLicensing,
                  includeTaxes: params.includeTaxes
                })}
              >
                {km.toLocaleString('pt-BR')} km
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm">Severidade de Operação</Label>
          <RadioGroup 
            value={params.operationSeverity.toString()} 
            onValueChange={(value) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: parseInt(value) as 1|2|3|4|5|6,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
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
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`tracking-${vehicleId}`} 
            checked={params.hasTracking}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: checked,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
          />
          <Label htmlFor={`tracking-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir rastreamento
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`ipva-${vehicleId}`} 
            checked={params.includeIpva || false}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: checked,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
          />
          <Label htmlFor={`ipva-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir IPVA ({((vehicleItem.vehicleGroup.ipvaCost || 0) * 100).toFixed(2)}% do valor do veículo)
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`licensing-${vehicleId}`} 
            checked={params.includeLicensing || false}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: checked,
              includeTaxes: params.includeTaxes
            })}
          />
          <Label htmlFor={`licensing-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir Licenciamento
          </Label>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id={`taxes-${vehicleId}`} 
            checked={params.includeTaxes || false}
            onCheckedChange={(checked) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: params.protectionPlanId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: checked
            })}
          />
          <Label htmlFor={`taxes-${vehicleId}`} className="cursor-pointer text-sm">
            Incluir Custos Financeiros
          </Label>
        </div>
        
        <div className="space-y-3 pt-3 border-t">
          <Label className="text-sm">Plano de Proteção</Label>
          <ProtectionPlanSelector
            selectedPlanId={params.protectionPlanId || null}
            onChange={(planId) => setVehicleParams(vehicleId, { 
              contractMonths: params.contractMonths,
              monthlyKm: params.monthlyKm,
              operationSeverity: params.operationSeverity,
              hasTracking: params.hasTracking,
              protectionPlanId: planId,
              includeIpva: params.includeIpva,
              includeLicensing: params.includeLicensing,
              includeTaxes: params.includeTaxes
            })}
          />
        </div>
      </div>
    );
  };

  const renderParamsStep = () => {
    if (!quoteForm) {
      return (
        <div className="p-8 text-center">
          <div className="mb-4 text-red-500">
            Erro ao carregar os dados do formulário.
          </div>
          <Button onClick={goToPreviousStep}>
            Voltar
          </Button>
        </div>
      );
    }

    return (
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
                  value={[quoteForm.globalParams?.contractMonths || 24]}
                  min={6}
                  max={24}
                  step={1}
                  onValueChange={(value) => setGlobalContractMonths(value[0])}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>6 meses</span>
                  <span>{quoteForm.globalParams?.contractMonths || 24} meses</span>
                  <span>24 meses</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base mb-2 block">Quilometragem Mensal</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {KM_OPTIONS.map((km) => (
                  <Button 
                    key={`global-km-${km}`}
                    type="button"
                    variant={(quoteForm.globalParams?.monthlyKm || 3000) === km ? "default" : "outline"}
                    onClick={() => setGlobalMonthlyKm(km)}
                    className="w-full"
                  >
                    {km.toLocaleString('pt-BR')} km
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base">Severidade de Operação</Label>
              <RadioGroup 
                value={String(quoteForm.globalParams?.operationSeverity || 3)} 
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
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch 
                id="tracking" 
                checked={quoteForm.globalParams?.hasTracking || false}
                onCheckedChange={setGlobalHasTracking}
              />
              <Label htmlFor="tracking" className="cursor-pointer">Incluir rastreamento</Label>
            </div>
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch 
                id="ipva" 
                checked={quoteForm.globalParams?.includeIpva || false}
                onCheckedChange={setGlobalIncludeIpva}
              />
              <Label htmlFor="ipva" className="cursor-pointer">Incluir IPVA</Label>
            </div>
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch 
                id="licensing" 
                checked={quoteForm.globalParams?.includeLicensing || false}
                onCheckedChange={setGlobalIncludeLicensing}
              />
              <Label htmlFor="licensing" className="cursor-pointer">Incluir Licenciamento</Label>
            </div>
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch 
                id="taxes" 
                checked={quoteForm.globalParams?.includeTaxes || false}
                onCheckedChange={setGlobalIncludeTaxes}
              />
              <Label htmlFor="taxes" className="cursor-pointer">Incluir Custos Financeiros</Label>
            </div>
            
            <div className="pt-6 border-t space-y-3">
              <Label className="text-base">Plano de Proteção</Label>
              <ProtectionPlanSelector
                selectedPlanId={quoteForm.globalParams?.protectionPlanId || null}
                onChange={setGlobalProtectionPlanId}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-medium">Parâmetros por Veículo</h3>
            {quoteForm.vehicles && quoteForm.vehicles.length > 0 && (
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
  };

  const renderResultStep = () => {
    const result = calculateQuote();
    
    if (!result) {
      return (
        <div className="p-8 text-center">
          <div className="mb-4">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </span>
          </div>
          <h3 className="text-lg font-medium mb-2">Não foi possível calcular o orçamento</h3>
          <p className="text-muted-foreground mb-6">
            Verifique se todos os dados estão preenchidos corretamente e se há pelo menos um veículo adicionado.
          </p>
          <Button variant="outline" onClick={goToPreviousStep}>
            Voltar para parâmetros
          </Button>
        </div>
      );
    }
    
    const { vehicleResults, totalCost } = result;
    
    return (
      <div className="space-y-8 animate-fadeIn">
        <Card>
          <CardHeader title={`Resumo do Orçamento - ${quoteForm?.vehicles?.length || 0} veículo(s)`} />
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{quoteForm?.client?.name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="font-medium">{quoteForm?.globalParams?.contractMonths || 24} meses</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quilometragem</p>
                <p className="font-medium">{(quoteForm?.globalParams?.monthlyKm || 3000).toLocaleString('pt-BR')} km/mês</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Severidade</p>
                <p className="font-medium">Nível {quoteForm?.globalParams?.operationSeverity || 3}</p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Veículos Cotados</h3>
              <div className="space-y-4">
                {vehicleResults.map((result, index) => {
                  if (!quoteForm?.vehicles) return null;
                  
                  const vehicleItem = quoteForm.vehicles.find(v => v.vehicle.id === result.vehicleId);
                  if (!vehicleItem) return null;
                  
                  const params = quoteForm.useGlobalParams 
                    ? quoteForm.globalParams 
                    : (vehicleItem.params || quoteForm.globalParams || {
                      contractMonths: 24,
                      monthlyKm: 3000,
                      operationSeverity: 3 as 1|2|3|4|5|6,
                      hasTracking: false,
                      protectionPlanId: null,
                      includeIpva: false,
                      includeLicensing: false,
                      includeTaxes: false,
                    });
                  
                  // Verificar se há impostos incluídos
                  const hasTaxes = (result.includeTaxes && result.taxCost > 0) || 
                                 (result.includeIpva && result.ipvaCost > 0) || 
                                 (result.includeLicensing && result.licensingCost > 0);
                  
                  // Calcular o total de impostos
                  const totalTaxes = (result.taxCost || 0) + (result.ipvaCost || 0) + (result.licensingCost || 0);
                  
                  // Obter breakdown dos impostos
                  const taxBreakdown = result.includeTaxes && result.contractMonths 
                    ? getTaxBreakdown(vehicleItem.vehicle.value, result.contractMonths) 
                    : null;
                  
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
                          <p className="font-medium">{formatCurrency(result.totalCost)}</p>
                          <p className="text-xs text-muted-foreground">Valor mensal</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="text-sm">
                          <p className="text-muted-foreground">Depreciação:</p>
                          <p className="font-medium">{formatCurrency(result.depreciationCost)}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Manutenção:</p>
                          <p className="font-medium">{formatCurrency(result.maintenanceCost)}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Km excedente:</p>
                          <p className="font-medium">R$ {result.extraKmRate.toFixed(2)}</p>
                        </div>
                        {result.protectionCost > 0 && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Proteção:</p>
                            <p className="font-medium">{formatCurrency(result.protectionCost)}</p>
                          </div>
                        )}
                      </div>

                      {/* Seção de impostos e taxas com Accordion */}
                      {hasTaxes && (
                        <div className="mt-3 pt-3 border-t">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="taxes" className="border-0">
                              <div className="flex justify-between items-center">
                                <AccordionTrigger className="py-1 text-sm text-primary font-medium hover:underline">
                                  Impostos e taxas:
                                </AccordionTrigger>
                                <span className="text-sm font-medium">{formatCurrency(totalTaxes)}/mês</span>
                              </div>
                              
                              <AccordionContent className="py-2">
                                <div className="text-sm space-y-2 text-muted-foreground bg-slate-50 p-3 rounded-md">
                                  {result.includeIpva && result.ipvaCost && result.ipvaCost > 0 && (
                                    <div className="flex justify-between">
                                      <span>IPVA:</span>
                                      <span>{formatCurrency(result.ipvaCost)}/mês</span>
                                    </div>
                                  )}
                                  
                                  {result.includeLicensing && result.licensingCost && result.licensingCost > 0 && (
                                    <div className="flex justify-between">
                                      <span>Licenciamento:</span>
                                      <span>{formatCurrency(result.licensingCost)}/mês</span>
                                    </div>
                                  )}
                                  
                                  {result.includeTaxes && result.taxCost && result.taxCost > 0 && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Custos financeiros:</span>
                                        <span>{formatCurrency(result.taxCost)}/mês</span>
                                      </div>
                                      
                                      {taxBreakdown && (
                                        <Accordion type="single" collapsible className="mt-2">
                                          <AccordionItem value="finance-details" className="border-0">
                                            <AccordionTrigger className="text-xs text-primary hover:underline py-1">
                                              Detalhamento dos custos financeiros
                                            </AccordionTrigger>
                                            
                                            <AccordionContent className="pt-2">
                                              <div className="space-y-2 text-xs pl-2 border-l-2 border-slate-200 mt-1">
                                                <div className="flex justify-between">
                                                  <span>Taxa SELIC ({result.contractMonths >= 24 ? '24 meses' : result.contractMonths >= 18 ? '18 meses' : '12 meses'}):</span>
                                                  <span>{taxBreakdown.selicRate.toFixed(2)}% a.a.</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Spread financeiro:</span>
                                                  <span>{taxBreakdown.spread.toFixed(2)}% a.a.</span>
                                                </div>
                                                <div className="flex justify-between font-medium">
                                                  <span>Taxa total anual:</span>
                                                  <span>{taxBreakdown.totalTaxRate.toFixed(2)}% a.a.</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Custo anual:</span>
                                                  <span>{formatCurrency(taxBreakdown.annualCost)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Custo mensal:</span>
                                                  <span>{formatCurrency(taxBreakdown.monthlyCost)}</span>
                                                </div>
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        </Accordion>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                      
                      {result.protectionPlanId && (
                        <div className="mt-3 pt-3 border-t">
                          <ProtectionDetails planId={result.protectionPlanId} />
                        </div>
                      )}
                      
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
                          <div>
                            <p className="text-muted-foreground">IPVA:</p>
                            <p>{params.includeIpva ? 'Sim' : 'Não'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Licenciamento:</p>
                            <p>{params.includeLicensing ? 'Sim' : 'Não'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Custos Financeiros:</p>
                            <p>{params.includeTaxes ? 'Sim' : 'Não'}</p>
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
                {formatCurrency(totalCost)}
              </p>
              <p className="text-sm text-muted-foreground">
                {quoteForm?.vehicles?.length || 0} veículo(s)
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Carregando orçamento...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="p-8 text-center">
          <div className="mb-4 text-red-500">
            {loadError}
          </div>
          <Button onClick={() => navigate('/orcamentos')}>
            Voltar para lista de orçamentos
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <PageTitle 
                title={isEditMode ? "Editar Orçamento" : "Novo Orçamento"} 
                subtitle={isEditMode 
                  ? "Atualize os detalhes do orçamento existente" 
                  : "Preencha os dados para criar um novo orçamento"
                } 
                breadcrumbs={[
                  { label: "Orçamentos", url: "/orcamentos" },
                  { label: isEditMode ? "Editar" : "Novo", url: "#" }
                ]}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    {index > 0 && <span className="w-4 h-0.5 bg-gray-200"></span>}
                    <div 
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        currentStep === step.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                      title={step.name}
                    >
                      {step.icon}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          
          {renderStepContent()}
          
          <div className="flex justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={currentStep === 'client' ? () => navigate('/orcamentos') : goToPreviousStep}
            >
              {currentStep === 'client' ? 'Cancelar' : 'Voltar'}
            </Button>
            <Button 
              type="button" 
              onClick={handleNextStep} 
              disabled={
                (currentStep === 'client' && !quoteForm?.client) || 
                (currentStep === 'vehicle' && (!quoteForm?.vehicles || quoteForm.vehicles.length === 0))
              }
            >
              {currentStep === 'result' ? (isEditMode ? 'Atualizar' : 'Finalizar') : 'Continuar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const NewQuote = () => {
  return (
    <MainLayout>
      <QuoteProvider>
        <PageTitle
          title="Criar orçamento"
          breadcrumbs={[
            { label: "Home", url: "/" },
            { label: "Orçamentos", url: "/orcamentos" },
            { label: "Novo Orçamento", url: "/orcamento/novo" }
          ]}
        />
        
        <QuoteForm />
      </QuoteProvider>
    </MainLayout>
  );
};

export default NewQuote;
