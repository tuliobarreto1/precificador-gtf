import React, { useState } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Client, ClientType } from '@/lib/models';

export interface CustomClient {
  id: string;
  name: string;
  type: ClientType;
  document: string;
  email?: string;
  contact?: string;
  responsible?: string;
  isNew?: boolean;
}

interface ClientFormProps {
  onClientSelect: (client: Client | CustomClient) => void;
  existingClients: Client[];
  segment?: 'GTF' | 'Assinatura';
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  onClientSelect, 
  existingClients,
  segment 
}) => {
  const [newClient, setNewClient] = useState<Omit<Client, 'id'> & { id?: string }>({
    name: '',
    type: 'PF',
    document: '',
    email: '',
    contact: '',
    responsible: ''
  });
  const [selectedExistingClient, setSelectedExistingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  // Filtrar clientes existentes baseado no segmento
  const filteredExistingClients = segment === 'Assinatura' 
    ? existingClients.filter(client => {
        return client.type === 'PF' || 
          (client.document && client.document.replace(/\D/g, '').length === 11);
      })
    : existingClients;

  const handleExistingClientSelect = (client: Client) => {
    console.log("Cliente existente selecionado:", client);
    
    // Validação para segmento Assinatura
    if (segment === 'Assinatura') {
      const isPersonaFisica = client.type === 'PF' || 
        (client.document && client.document.replace(/\D/g, '').length === 11);
      
      if (!isPersonaFisica) {
        toast({
          title: "Cliente não permitido",
          description: "O segmento Assinatura é exclusivo para Pessoa Física (CPF).",
          variant: "destructive"
        });
        return;
      }
    }
    
    setSelectedExistingClient(client);
    onClientSelect(client);
  };

  const handleNewClientSubmit = () => {
    if (!newClient.name || !newClient.document) {
      toast({
        title: "Dados obrigatórios",
        description: "Nome e documento são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validação para segmento Assinatura
    if (segment === 'Assinatura') {
      const documentNumbers = newClient.document.replace(/\D/g, '');
      if (documentNumbers.length !== 11) {
        toast({
          title: "Documento inválido",
          description: "Para o segmento Assinatura, apenas CPF (11 dígitos) é permitido.",
          variant: "destructive"
        });
        return;
      }
    }

    const customClient: CustomClient = {
      id: `new-${Date.now()}`,
      name: newClient.name,
      type: newClient.type,
      document: newClient.document,
      email: newClient.email || undefined,
      contact: newClient.contact || undefined,
      responsible: newClient.responsible || undefined,
      isNew: true
    };

    console.log("Novo cliente criado:", customClient);
    onClientSelect(customClient);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Selecione ou cadastre um cliente</h3>
        
        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Cliente Existente</TabsTrigger>
            <TabsTrigger value="new">Novo Cliente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4">
            {filteredExistingClients.length > 0 ? (
              <div className="grid gap-2">
                {filteredExistingClients.map((client) => (
                  <Card 
                    key={client.id}
                    className={`cursor-pointer transition-colors ${
                      selectedExistingClient?.id === client.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleExistingClientSelect(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{client.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {client.document}
                          </p>
                          {client.email && (
                            <p className="text-sm text-muted-foreground">
                              {client.email}
                            </p>
                          )}
                        </div>
                        {selectedExistingClient?.id === client.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {segment === 'Assinatura' 
                    ? 'Nenhum cliente Pessoa Física encontrado' 
                    : 'Nenhum cliente encontrado'
                  }
                </h3>
                <p className="text-gray-600">
                  {segment === 'Assinatura'
                    ? 'Cadastre um novo cliente com CPF para continuar'
                    : 'Cadastre um novo cliente para continuar'
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select 
                  value={newClient.type} 
                  onValueChange={(value: ClientType) => setNewClient(prev => ({ ...prev, type: value }))}
                  disabled={segment === 'Assinatura'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    {segment !== 'Assinatura' && (
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {segment === 'Assinatura' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Apenas Pessoa Física é permitida no segmento Assinatura
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="document">
                  {newClient.type === 'PF' ? 'CPF' : 'CNPJ'} *
                </Label>
                <Input
                  id="document"
                  value={newClient.document}
                  onChange={(e) => setNewClient(prev => ({ ...prev, document: e.target.value }))}
                  placeholder={newClient.type === 'PF' ? 'Digite o CPF' : 'Digite o CNPJ'}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o e-mail"
                />
              </div>

              <div>
                <Label htmlFor="contact">Telefone</Label>
                <Input
                  id="contact"
                  value={newClient.contact}
                  onChange={(e) => setNewClient(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Digite o telefone"
                />
              </div>

              {newClient.type === 'PJ' && (
                <div>
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input
                    id="responsible"
                    value={newClient.responsible}
                    onChange={(e) => setNewClient(prev => ({ ...prev, responsible: e.target.value }))}
                    placeholder="Digite o nome do responsável"
                  />
                </div>
              )}
            </div>

            <Button onClick={handleNewClientSubmit} className="w-full">
              Cadastrar Cliente
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientForm;
