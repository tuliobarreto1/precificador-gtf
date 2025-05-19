
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleStep from './steps/VehicleStep';
import ClientStep from './steps/ClientStep';
import ParamsStep from './steps/ParamsStep';
import ResultStep from './steps/ResultStep';
import { Button } from '@/components/ui/button';
import { useQuoteForm } from '@/hooks/useQuoteForm';
import { Loader2 } from 'lucide-react';
import { useQuote } from '@/context/QuoteContext';

// Adicionando as propriedades ao tipo de componente
interface QuoteFormProps {
  offlineMode?: boolean;
  onOfflineModeChange?: (enabled: boolean) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ offlineMode = false, onOfflineModeChange }) => {
  const [activeTab, setActiveTab] = useState<string>("vehicle");
  const { isLoading, saveQuote } = useQuoteForm();
  const { quoteForm } = useQuote();
  
  // Verifica se a cotação tem veículos para habilitar navegação
  const hasVehicles = quoteForm.vehicles && quoteForm.vehicles.length > 0;
  
  // Verifica se a cotação tem cliente para habilitar navegação
  const hasClient = quoteForm.client && quoteForm.client.id;
  
  // Função para avançar para a próxima etapa
  const goToNextStep = (currentTab: string) => {
    switch(currentTab) {
      case 'vehicle':
        setActiveTab('client');
        break;
      case 'client':
        setActiveTab('params');
        break;
      case 'params':
        setActiveTab('result');
        break;
      default:
        break;
    }
  };
  
  // Função para voltar para a etapa anterior
  const goToPreviousStep = (currentTab: string) => {
    switch(currentTab) {
      case 'client':
        setActiveTab('vehicle');
        break;
      case 'params':
        setActiveTab('client');
        break;
      case 'result':
        setActiveTab('params');
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="vehicle">Veículos</TabsTrigger>
          <TabsTrigger value="client" disabled={!hasVehicles}>Cliente</TabsTrigger>
          <TabsTrigger value="params" disabled={!hasVehicles || !hasClient}>Parâmetros</TabsTrigger>
          <TabsTrigger value="result" disabled={!hasVehicles || !hasClient}>Resultados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicle" className="mt-6">
          <VehicleStep 
            onNext={() => goToNextStep('vehicle')} 
            offlineMode={offlineMode}  
            onOfflineModeChange={onOfflineModeChange}
          />
        </TabsContent>
        
        <TabsContent value="client" className="mt-6">
          <ClientStep 
            onNext={() => goToNextStep('client')} 
            onPrevious={() => goToPreviousStep('client')} 
            offlineMode={offlineMode}
          />
        </TabsContent>
        
        <TabsContent value="params" className="mt-6">
          <ParamsStep 
            onNext={() => goToNextStep('params')} 
            onPrevious={() => goToPreviousStep('params')} 
          />
        </TabsContent>
        
        <TabsContent value="result" className="mt-6">
          <ResultStep 
            onPrevious={() => goToPreviousStep('result')} 
            offlineMode={offlineMode}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-8">
        <Button 
          onClick={saveQuote} 
          disabled={isLoading || !hasVehicles || !hasClient}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : 'Salvar Orçamento'}
        </Button>
      </div>
    </div>
  );
};

export default QuoteForm;
