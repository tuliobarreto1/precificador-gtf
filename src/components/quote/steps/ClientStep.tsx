
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import ClientForm from '@/components/quote/ClientForm';
import { Client } from '@/lib/models';
import { CustomClient } from '@/components/quote/ClientForm';

interface ClientStepProps {
  onClientSelect: (client: Client | CustomClient) => void;
  existingClients: Client[];
}

const ClientStep: React.FC<ClientStepProps> = ({ onClientSelect, existingClients }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <ClientForm 
        onClientSelect={onClientSelect} 
        existingClients={existingClients}
      />
    </div>
  );
};

export default ClientStep;
