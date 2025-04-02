
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client } from '@/lib/models';
import { addClient, getClientByDocument } from '@/lib/data-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CustomClient extends Client {
  isCustom: boolean;
}

export interface ClientFormProps {
  onClientSelect?: (client: Client | CustomClient) => void;
  existingClients?: Client[];
}

export default function ClientForm({ onClientSelect, existingClients = [] }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>(existingClients);
  const [formData, setFormData] = useState({
    document: '',
    name: '',
    email: '',
    contact: '',
    responsible: '',
  });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const documentType = formData.document.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ';
  const { toast } = useToast();

  // Carregar clientes do Supabase se não foram fornecidos
  useEffect(() => {
    if (existingClients.length === 0) {
      const fetchClients = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true });
          
          if (error) {
            console.error('Erro ao buscar clientes:', error);
            return;
          }
          
          const mappedClients: Client[] = data.map(client => ({
            id: client.id,
            name: client.name,
            type: client.type as 'PF' | 'PJ',
            document: client.document || '',
            email: client.email || '',
            contact: client.phone || '',
            responsible: client.responsible_person || ''
          }));
          
          setClients(mappedClients);
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchClients();
    }
  }, [existingClients]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }
  };

  const searchCNPJ = async (numbers: string) => {
    if (numbers.length !== 14) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${numbers}`);
      if (!response.ok) throw new Error('Falha ao buscar CNPJ');
      
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        name: data.razao_social,
      }));
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value);
    setFormData(prev => ({ ...prev, document: formatted }));

    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 14) {
      searchCNPJ(numbers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.document || !formData.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe um cliente com esse documento
      const existingClient = await getClientByDocument(formData.document);
      if (existingClient) {
        toast({
          title: "Cliente já cadastrado",
          description: "Já existe um cliente cadastrado com este documento.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Criar novo cliente no Supabase
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          type: documentType,
          document: formData.document,
          email: formData.email,
          phone: formData.contact,
          responsible_person: formData.responsible
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar cliente:', error);
        toast({
          title: "Erro ao cadastrar cliente",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const newClient: Client = {
        id: data.id,
        name: data.name,
        type: data.type as 'PF' | 'PJ',
        document: data.document || '',
        email: data.email || '',
        contact: data.phone || '',
        responsible: data.responsible_person || ''
      };

      // Atualizar lista local de clientes
      setClients(prev => [...prev, newClient]);
      
      if (onClientSelect) {
        const customClient: CustomClient = {
          ...newClient,
          isCustom: true
        };
        onClientSelect(customClient);
        
        setSelectedClientId(newClient.id);
      }
      
      toast({
        title: "Cliente adicionado",
        description: "Cliente adicionado com sucesso!",
      });

      // Limpar formulário
      setFormData({
        document: '',
        name: '',
        email: '',
        contact: '',
        responsible: '',
      });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao tentar cadastrar o cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    if (onClientSelect) {
      onClientSelect(client);
      setSelectedClientId(client.id);
    }
  };

  return (
    <div className="space-y-6">
      {clients.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Selecione um Cliente Existente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/30 ${
                  selectedClientId === client.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleSelectClient(client)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{client.name}</h4>
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
      )}

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Ou Cadastre um Novo Cliente</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="document">
                {documentType === 'PJ' ? 'CNPJ' : 'CPF'} *
              </Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder="Digite o CPF ou CNPJ"
                maxLength={18}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="name">
                {documentType === 'PJ' ? 'Razão Social' : 'Nome'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={documentType === 'PJ' && loading}
              />
            </div>

            <div>
              <Label htmlFor="contact">Contato</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData(prev => ({ ...prev, contact: formatPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="responsible">Pessoa Responsável</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Novo Cliente'}
          </Button>
        </form>
      </div>
    </div>
  );
}
