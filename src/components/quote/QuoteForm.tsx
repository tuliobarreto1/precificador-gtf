import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Car, Wrench, Calculator, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Client, ClientType } from '@/lib/models';
import { useQuote } from '@/context/QuoteContext';
import { CustomClient } from '@/components/quote/ClientForm';

// Componentes de etapa
import SegmentStep from './steps/SegmentStep';
import ClientStep from './steps/ClientStep';
import VehicleStep from './steps/VehicleStep';
import ParamsStep from './steps/ParamsStep';
import ResultStep from './steps/ResultStep';

const STEPS = [
  { id: 'segment', name: 'Segmento', icon: <Target size={18} /> },
  { id: 'client', name: 'Cliente', icon: <Users size={18} /> },
  { id: 'vehicle', name: 'Veículos', icon: <Car size={18} /> },
  { id: 'params', name: 'Parâmetros', icon: <Wrench size={18} /> },
  { id: 'result', name: 'Resultado', icon: <Calculator size={18} /> },
];

const QuoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState('segment');
  const [loadingQuote, setLoadingQuote] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempted, setLoadAttempted] = useState<boolean>(false);
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const loadAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const emptyQuoteForm = {
    segment: undefined,
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
    setSegment = () => {},
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

  const handleNextStep = async () => {
    console.log(`👆 Botão CONTINUAR clicado: avançando de ${currentStep} para o próximo passo.`);
    
    if (currentStep === 'segment') {
      if (!quoteForm?.segment) {
        toast({
          title: "Selecione um segmento",
          description: "É necessário selecionar um segmento para continuar."
        });
        return;
      }
      console.log("✅ Avançando para etapa de cliente");
      setCurrentStep('client');
      return;
    }
    
    if (currentStep === 'client') {
      if (!quoteForm?.client) {
        toast({
          title: "Selecione um cliente",
          description: "É necessário selecionar um cliente para continuar."
        });
        return;
      }
      
      // Validação específica para Assinatura: apenas CPF
      if (quoteForm.segment === 'Assinatura') {
        const isPersonaFisica = quoteForm.client.type === 'PF' || 
          (quoteForm.client.document && quoteForm.client.document.replace(/\D/g, '').length === 11);
        
        if (!isPersonaFisica) {
          toast({
            title: "Segmento inválido para cliente",
            description: "O segmento Assinatura é exclusivo para Pessoa Física (CPF).",
            variant: "destructive"
          });
          return;
        }
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
      return;
    }
    
    if (currentStep === 'params') {
      console.log("✅ Avançando para etapa de resultado");
      setCurrentStep('result');
      return;
    }
    
    if (currentStep === 'result') {
      console.log("✅ Finalizando orçamento");
      
      // Validação ROIC para Assinatura
      if (quoteForm.segment === 'Assinatura') {
        const result = calculateQuote();
        if (result && result.vehicleResults) {
          const hasLowROIC = result.vehicleResults.some(vehicle => {
            const vehicleInfo = quoteForm.vehicles.find(v => v.vehicle.id === vehicle.vehicleId);
            if (vehicleInfo) {
              const roic = (vehicle.totalCost * 12) / vehicleInfo.vehicle.value;
              return roic < 0.027; // 2.7%
            }
            return false;
          });
          
          if (hasLowROIC) {
            toast({
              title: "ROIC insuficiente",
              description: "Para o segmento Assinatura, o ROIC deve ser no mínimo 2,7%.",
              variant: "destructive"
            });
            return;
          }
        }
      }
      
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
      case 'client':
        setCurrentStep('segment');
        break;
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

  const handleSegmentSelect = (segment: 'GTF' | 'Assinatura') => {
    console.log("Segmento selecionado:", segment);
    setSegment(segment);
    
    // Para Assinatura, definir severidade operacional como 1
    if (segment === 'Assinatura') {
      setGlobalOperationSeverity(1);
    }
  };

  const handleClientSelect = (client: Client | CustomClient) => {
    console.log("Cliente selecionado:", client);
    if (client) {
      setClient(client);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'segment':
        return (
          <SegmentStep onSegmentSelect={handleSegmentSelect} />
        );
      case 'client':
        return (
          <ClientStep 
            onClientSelect={handleClientSelect} 
            existingClients={existingClients}
            segment={quoteForm?.segment}
          />
        );
      case 'vehicle':
        return (
          <VehicleStep 
            onSelectVehicle={addVehicle}
            onRemoveVehicle={removeVehicle}
            selectedVehicles={quoteForm?.vehicles ? quoteForm.vehicles.map(item => item.vehicle) : []}
          />
        );
      case 'params':
        return (
          <ParamsStep 
            quoteForm={quoteForm}
            setUseGlobalParams={setUseGlobalParams}
            setGlobalContractMonths={setGlobalContractMonths}
            setGlobalMonthlyKm={setGlobalMonthlyKm}
            setGlobalOperationSeverity={setGlobalOperationSeverity}
            setGlobalHasTracking={setGlobalHasTracking}
            setGlobalProtectionPlanId={setGlobalProtectionPlanId}
            setGlobalIncludeIpva={setGlobalIncludeIpva}
            setGlobalIncludeLicensing={setGlobalIncludeLicensing}
            setGlobalIncludeTaxes={setGlobalIncludeTaxes}
            setVehicleParams={setVehicleParams}
          />
        );
      case 'result':
        return (
          <ResultStep 
            quoteForm={quoteForm}
            result={calculateQuote()}
            isEditMode={isEditMode}
            currentEditingQuoteId={currentEditingQuoteId}
            goToPreviousStep={goToPreviousStep}
          />
        );
      default:
        return null;
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
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditMode ? "Editar Orçamento" : "Novo Orçamento"}
                {quoteForm?.segment && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({quoteForm.segment})
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode 
                  ? "Atualize os detalhes do orçamento existente" 
                  : "Preencha os dados para criar um novo orçamento"
                }
              </p>
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
              onClick={currentStep === 'segment' ? () => navigate('/orcamentos') : goToPreviousStep}
            >
              {currentStep === 'segment' ? 'Cancelar' : 'Voltar'}
            </Button>
            <Button 
              type="button" 
              onClick={handleNextStep} 
              disabled={
                (currentStep === 'segment' && !quoteForm?.segment) ||
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

export default QuoteForm;
