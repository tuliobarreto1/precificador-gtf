
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import ClientForm from '@/components/quote/ClientForm';
import { Client } from '@/lib/models';
import { CustomClient } from '@/components/quote/ClientForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ClientStepProps {
  onClientSelect: (client: Client | CustomClient) => void;
  existingClients: Client[];
  segment?: 'GTF' | 'Assinatura';
}

const ClientStep: React.FC<ClientStepProps> = ({ 
  onClientSelect, 
  existingClients,
  segment 
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {segment === 'Assinatura' && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Segmento Assinatura:</strong> Apenas clientes Pessoa Física (CPF) são permitidos neste segmento.
          </AlertDescription>
        </Alert>
      )}
      
      <ClientForm 
        onClientSelect={onClientSelect} 
        existingClients={existingClients}
        segment={segment}
      />
    </div>
  );
};

export default ClientStep;
