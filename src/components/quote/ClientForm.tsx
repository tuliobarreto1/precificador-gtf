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

interface ClientFormProps {
  formData: any;
  setFormData: (data: any) => void;
  existingClients: Client[];
}

const ClientForm: React.FC<ClientFormProps> = ({ formData, setFormData, existingClients }) => {
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, type: value });
  };

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        ...formData,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        document: selectedClient.document,
        email: selectedClient.email || ''
      });
    }
  }, [selectedClient]);

  const handleClientSelection = (clientId: string) => {
    if (clientId === 'new') {
      setShowNewClientForm(true);
      setSelectedClient(null);
    } else {
      const selectedClient = existingClients.find(client => client.id === clientId);
      if (selectedClient) {
        setShowNewClientForm(false);
        setSelectedClient(selectedClient);
        setFormData({
          ...formData,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          document: selectedClient.document,
          email: selectedClient.email || ''
        });
      }
    }
  };

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
                value={formData.clientName}
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
                value={formData.document}
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
                value={formData.email}
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
