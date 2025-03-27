import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Users, Car, Wrench, Calculator } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { clients, vehicles, vehicleGroups, getVehicleGroupById } from '@/lib/mock-data';
import { useQuote, QuoteProvider } from '@/context/QuoteContext';

const STEPS = [
  { id: 'client', name: 'Cliente', icon: <Users size={18} /> },
  { id: 'vehicle', name: 'Veículo', icon: <Car size={18} /> },
  { id: 'params', name: 'Parâmetros', icon: <Wrench size={18} /> },
  { id: 'result', name: 'Resultado', icon: <Calculator size={18} /> },
];

const QuoteForm = () => {
  const [currentStep, setCurrentStep] = useState('client');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    quoteForm, 
    setClient, 
    setVehicle, 
    setContractMonths, 
    setMonthlyKm, 
    setOperationSeverity, 
    setHasTracking, 
    calculateQuote 
  } = useQuote();

  const goToNextStep = () => {
    switch (currentStep) {
      case 'client':
        if (!quoteForm.client) {
          toast({ title: "Selecione um cliente", description: "É necessário selecionar um cliente para continuar." });
          return;
        }
        setCurrentStep('vehicle');
        break;
      case 'vehicle':
        if (!quoteForm.vehicle) {
          toast({ title: "Selecione um veículo", description: "É necessário selecionar um veículo para continuar." });
          return;
        }
        setCurrentStep('params');
        break;
      case 'params':
        setCurrentStep('result');
        break;
      case 'result':
        toast({ title: "Orçamento salvo", description: "Seu orçamento foi salvo com sucesso." });
        navigate('/orcamentos');
        break;
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

  const renderClientStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              quoteForm.client?.id === client.id
                ? 'border-primary/70 ring-1 ring-primary/30 shadow-sm'
                : 'border-border hover:border-primary/30'
            }`}
            onClick={() => setClient(client)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{client.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {client.type === 'PJ' ? 'CNPJ' : 'CPF'}: {client.document}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                client.type === 'PJ' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </span>
            </div>
            {client.email && (
              <p className="text-sm mt-2">{client.email}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderVehicleStep = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((vehicle) => {
          const group = getVehicleGroupById(vehicle.groupId);
          if (!group) return null;
          
          return (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              vehicleGroup={group}
              isSelected={quoteForm.vehicle?.id === vehicle.id}
              onClick={() => setVehicle(vehicle, group)}
            />
          );
        })}
      </div>
    </div>
  );

  const renderParamsStep = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-4">
        <Label className="text-base">Prazo do Contrato</Label>
        <div className="space-y-3">
          <Slider
            value={[quoteForm.contractMonths]}
            min={6}
            max={24}
            step={1}
            onValueChange={(value) => setContractMonths(value[0])}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>6 meses</span>
            <span>{quoteForm.contractMonths} meses</span>
            <span>24 meses</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <Label className="text-base">Quilometragem Mensal</Label>
        <div className="space-y-3">
          <Slider
            value={[quoteForm.monthlyKm]}
            min={1000}
            max={5000}
            step={100}
            onValueChange={(value) => setMonthlyKm(value[0])}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1.000 km</span>
            <span>{quoteForm.monthlyKm.toLocaleString('pt-BR')} km</span>
            <span>5.000 km</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <Label className="text-base">Severidade de Operação</Label>
        <RadioGroup 
          value={quoteForm.operationSeverity.toString()} 
          onValueChange={(value) => setOperationSeverity(parseInt(value) as 1|2|3|4|5|6)}
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
          <Info size={14} className="inline-block" />
          <span>Quanto maior o nível, mais severo é o uso do veículo.</span>
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="tracking" 
          checked={quoteForm.hasTracking}
          onCheckedChange={setHasTracking}
        />
        <Label htmlFor="tracking" className="cursor-pointer">Incluir rastreamento</Label>
      </div>
    </div>
  );

  const renderResultStep = () => {
    const result = calculateQuote();
    if (!result) return <div>Não foi possível calcular o orçamento.</div>;
    
    const { depreciationCost, maintenanceCost, trackingCost, totalCost, costPerKm, extraKmRate } = result;
    
    return (
      <div className="space-y-8 animate-fadeIn">
        <Card>
          <CardHeader title="Resumo do Orçamento" />
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{quoteForm.client?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Veículo</p>
                <p className="font-medium">{quoteForm.vehicle?.brand} {quoteForm.vehicle?.model}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prazo</p>
                <p className="font-medium">{quoteForm.contractMonths} meses</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Quilometragem</p>
                <p className="font-medium">{quoteForm.monthlyKm.toLocaleString('pt-BR')} km/mês</p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Composição do Valor</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span>Depreciação</span>
                  <span className="font-medium">R$ {depreciationCost.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span>Manutenção</span>
                  <span className="font-medium">R$ {maintenanceCost.toLocaleString('pt-BR')}</span>
                </div>
                {quoteForm.hasTracking && (
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                    <span>Rastreamento</span>
                    <span className="font-medium">R$ {trackingCost.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-2xl font-semibold">Valor Total Mensal</h3>
              <p className="text-muted-foreground">Todos os impostos inclusos</p>
            </div>
            <div className="mt-4 md:mt-0 text-center md:text-right">
              <p className="text-3xl font-bold text-primary">
                R$ {totalCost.toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">
                R$ {costPerKm.toFixed(2)} por km
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Informações Adicionais" />
          <div className="p-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
              <div>
                <span>Valor do Quilômetro Excedente</span>
                <p className="text-xs text-muted-foreground">Cobrado ao final do contrato</p>
              </div>
              <span className="font-medium">R$ {extraKmRate.toFixed(2)}</span>
            </div>
          </div>
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-muted/30 p-1 rounded-lg">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
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
            </div>
          </React.Fragment>
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
        <Button onClick={goToNextStep}>
          {currentStep === 'result' ? 'Salvar Orçamento' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
};

const NewQuote = () => {
  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle 
          title="Novo Orçamento" 
          subtitle="Preencha os dados para gerar um novo orçamento de locação" 
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
