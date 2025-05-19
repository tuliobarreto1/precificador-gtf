
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ClientForm from '../ClientForm';
import { useQuoteContext } from '@/context/QuoteContext';

interface ClientStepProps {
  onNext: () => void;
  onPrevious: () => void;
  offlineMode?: boolean;
}

const ClientStep: React.FC<ClientStepProps> = ({ onNext, onPrevious, offlineMode = false }) => {
  const { quote } = useQuoteContext();
  const hasClient = quote.client && quote.client.id;

  return (
    <Card>
      <CardContent className="pt-6">
        <ClientForm offlineMode={offlineMode} />
        
        <div className="flex justify-between mt-6">
          <Button 
            onClick={onPrevious}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!hasClient}
            className="flex items-center"
          >
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientStep;
