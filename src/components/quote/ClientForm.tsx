
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Client } from '@/lib/mock-data';
import { CustomClient } from '@/context/QuoteContext';

interface ClientFormProps {
  formData?: any;
  setFormData?: (data: any) => void;
  existingClients?: Client[];
  onClientSelect: (client: Client | CustomClient) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  formData, 
  setFormData, 
  existingClients = [], 
  onClientSelect 
}) => {
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientData, setClientData] = useState({
    clientName: '',
    type: '',
    document: '',
    email: '',
    responsible: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientData({ ...clientData, [name]: value });
    if (setFormData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (value: string) => {
    setClientData({ ...clientData, type: value });
    if (setFormData) {
      setFormData({ ...formData, type: value });
    }
  };

  useEffect(() => {
    if (selectedClient) {
      setClientData({
        clientName: selectedClient.name,
        type: selectedClient.type,
        document: selectedClient.document,
        email: selectedClient.email || '',
        responsible: clientData.responsible
      });
      
      if (setFormData) {
        setFormData({
          ...formData,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          document: selectedClient.document,
          email: selectedClient.email || ''
        });
      }
      
      onClientSelect(selectedClient);
    }
  }, [selectedClient]);

  const handleClientSelection = (clientId: string) => {
    if (clientId === 'new') {
      setShowNewClientForm(true);
      setSelectedClient(null);
    } else {
      const client = existingClients.find(client => client.id === clientId);
      if (client) {
        setShowNewClientForm(false);
        setSelectedClient(client);
      }
    }
  };

  const handleSubmitNewClient = () => {
    if (!clientData.clientName || !clientData.document) {
      return; // Validação básica
    }
    
    const newClient: CustomClient = {
      id: `new-${Date.now()}`,
      name: clientData.clientName,
      type: clientData.type as 'PF' | 'PJ',
      document: clientData.document,
      email: clientData.email
    };
    
    onClientSelect(newClient);
  };

  useEffect(() => {
    if (showNewClientForm && clientData.clientName && clientData.document) {
      handleSubmitNewClient();
    }
  }, [clientData.clientName, clientData.document, clientData.email, clientData.type]);

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="col-span-2">
          <Label htmlFor="clientId">Cliente Existente</Label>
          <Select onValueChange={handleClientSelection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo Cliente</SelectItem>
              {existingClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showNewClientForm && (
          <>
            <div className="col-span-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                type="text"
                id="clientName"
                name="clientName"
                value={clientData.clientName}
                onChange={handleInputChange}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="col-span-1">
              <Label htmlFor="type">Tipo</Label>
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <Label htmlFor="document">Documento</Label>
              <Input
                type="text"
                id="document"
                name="document"
                value={clientData.document}
                onChange={handleInputChange}
                placeholder="CPF/CNPJ"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={clientData.email}
                onChange={handleInputChange}
                placeholder="Email do cliente"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ClientForm;
