
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomClient } from '@/context/types/quoteTypes';
import { Client } from '@/lib/models';

interface ClientFormProps {
  onClientCreate: (client: CustomClient) => void;
  onClientSelect: (client: Client | CustomClient) => void;
  onCancel: () => void;
  existingClients?: Client[];
  segment?: 'GTF' | 'Assinatura';
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  onClientCreate, 
  onClientSelect, 
  onCancel, 
  existingClients = [],
  segment 
}) => {
  const [formData, setFormData] = useState<CustomClient>({
    name: '',
    type: 'PJ',
    document: '',
    email: '',
    contact: '',
    responsible: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClientCreate(formData);
  };

  const handleInputChange = (field: keyof CustomClient, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {existingClients.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Selecionar Cliente Existente</h3>
          <div className="grid gap-2">
            {existingClients
              .filter(client => {
                if (segment === 'Assinatura') {
                  return client.type === 'PF' || 
                    (client.document && client.document.replace(/\D/g, '').length === 11);
                }
                return true;
              })
              .map(client => (
                <Button
                  key={client.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => onClientSelect(client)}
                >
                  <div className="text-left">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.document} - {client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Criar Novo Cliente</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome/Razão Social</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleInputChange('type', value)}
                disabled={segment === 'Assinatura'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  {segment !== 'Assinatura' && (
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => handleInputChange('document', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contact">Telefone</Label>
              <Input
                id="contact"
                value={formData.contact || ''}
                onChange={(e) => handleInputChange('contact', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible || ''}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
