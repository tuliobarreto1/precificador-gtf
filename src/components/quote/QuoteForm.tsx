
import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import VehicleStep from './steps/VehicleStep';
import ClientStep from './steps/ClientStep';
import ResultStep from './steps/ResultStep';
import ParamsStep from './steps/ParamsStep';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Vehicle, VehicleGroup, Client } from '@/lib/models';
import { useQuote } from '@/context/QuoteContext';

interface QuoteFormProps {
  offlineMode?: boolean;
  onOfflineModeChange?: (mode: boolean) => void;
}

// Componente de formulário de cotação
const QuoteForm: React.FC<QuoteFormProps> = ({
  offlineMode = false,
  onOfflineModeChange
}) => {
  const { 
    quoteForm,
    addVehicle, 
    removeVehicle,
    setClient,
    setGlobalContractMonths,
    setGlobalMonthlyKm,
    setGlobalOperationSeverity,
    setGlobalHasTracking,
    setGlobalIncludeIpva,
    setGlobalIncludeLicensing,
    setGlobalIncludeTaxes,
    isEditMode,
    calculateQuote
  } = useQuote();

  const [activeStep, setActiveStep] = useState<'vehicle' | 'client' | 'params' | 'result'>('vehicle');

  // Função para lidar com a seleção de veículos
  const handleSelectVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    addVehicle(vehicle, vehicleGroup);
  };

  // Função para lidar com a seleção de cliente
  const handleSelectClient = (client: Client) => {
    setClient(client);
  };

  // Função para lidar com a remoção de veículos
  const handleRemoveVehicle = (vehicleId: string) => {
    removeVehicle(vehicleId);
  };

  // Função para avançar para o próximo passo
  const handleNext = () => {
    if (activeStep === 'vehicle') setActiveStep('client');
    else if (activeStep === 'client') setActiveStep('params');
    else if (activeStep === 'params') setActiveStep('result');
  };

  // Função para voltar para o passo anterior
  const handlePrevious = () => {
    if (activeStep === 'result') setActiveStep('params');
    else if (activeStep === 'params') setActiveStep('client');
    else if (activeStep === 'client') setActiveStep('vehicle');
  };

  // Definir nome do passo ativo para exibição
  const getActiveStepName = () => {
    switch (activeStep) {
      case 'vehicle': return 'Veículos';
      case 'client': return 'Cliente';
      case 'params': return 'Parâmetros';
      case 'result': return 'Resultados';
      default: return 'Veículos';
    }
  };

  // Calcular resultado para passar para o ResultStep
  const quoteResult = calculateQuote();

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Novo orçamento - {getActiveStepName()}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrevious} 
              disabled={activeStep === 'vehicle'}
              className={`px-3 py-1 text-sm rounded ${activeStep === 'vehicle' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Voltar
            </button>
            <button 
              onClick={handleNext}
              disabled={activeStep === 'result' || (activeStep === 'vehicle' && quoteForm.vehicles.length === 0) || (activeStep === 'client' && !quoteForm.client)}
              className={`px-3 py-1 text-sm rounded ${(activeStep === 'result' || (activeStep === 'vehicle' && quoteForm.vehicles.length === 0) || (activeStep === 'client' && !quoteForm.client)) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'}`}
            >
              Avançar
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeStep} className="w-full">
          <TabsContent value="vehicle" className="mt-0">
            <VehicleStep 
              onSelectVehicle={handleSelectVehicle} 
              onRemoveVehicle={handleRemoveVehicle} 
              selectedVehicles={quoteForm.vehicles.map(v => v.vehicle)}
              offlineMode={offlineMode}
              onOfflineModeChange={onOfflineModeChange}
            />
          </TabsContent>
          <TabsContent value="client" className="mt-0">
            <ClientStep 
              onClientSelect={handleSelectClient} 
              existingClients={[]}
            />
          </TabsContent>
          <TabsContent value="params" className="mt-0">
            <ParamsStep 
              contractMonths={quoteForm.globalParams.contractMonths}
              monthlyKm={quoteForm.globalParams.monthlyKm}
              operationSeverity={quoteForm.globalParams.operationSeverity}
              hasTracking={quoteForm.globalParams.hasTracking}
              includeIpva={quoteForm.globalParams.includeIpva}
              includeLicensing={quoteForm.globalParams.includeLicensing}
              includeTaxes={quoteForm.globalParams.includeTaxes}
              onContractMonthsChange={setGlobalContractMonths}
              onMonthlyKmChange={setGlobalMonthlyKm}
              onOperationSeverityChange={setGlobalOperationSeverity}
              onHasTrackingChange={setGlobalHasTracking}
              onIncludeIpvaChange={setGlobalIncludeIpva}
              onIncludeLicensingChange={setGlobalIncludeLicensing}
              onIncludeTaxesChange={setGlobalIncludeTaxes}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </TabsContent>
          <TabsContent value="result" className="mt-0">
            <ResultStep 
              quoteForm={quoteForm} 
              result={quoteResult}
              isEditMode={isEditMode}
              currentEditingQuoteId={null}
              goToPreviousStep={handlePrevious}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QuoteForm;
