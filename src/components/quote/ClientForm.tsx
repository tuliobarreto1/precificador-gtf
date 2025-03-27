import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Client, clients } from '@/lib/mock-data';
import { useQuote, CustomClient } from '@/context/QuoteContext';
import { consultarCNPJ } from '@/services/cnpjService';

type ClientFormProps = {
  onClientSelect: (client: Client | CustomClient | null) => void;
};

const ClientForm: React.FC<ClientFormProps> = ({ onClientSelect }) => {
  const { toast } = useToast();
  const { createCustomClient, setQuoteResponsible, quoteForm } = useQuote();
  const [activeTab, setActiveTab] = useState<string>('existing');
  
  const [clientType, setClientType] = useState<'PF' | 'PJ'>('PJ');
  const [document, setDocument] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [responsible, setResponsible] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setQuoteResponsible(responsible);
  }, [responsible, setQuoteResponsible]);

  const formatDocument = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (clientType === 'PF') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  };

  const cleanDocumentValue = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = cleanDocumentValue(rawValue);
    
    if ((clientType === 'PF' && digits.length <= 11) || 
        (clientType === 'PJ' && digits.length <= 14)) {
      setDocument(formatDocument(digits));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    
    let formattedValue = digits;
    if (digits.length > 0) {
      formattedValue = `(${digits.slice(0, 2)}`;
      if (digits.length > 2) {
        formattedValue += `) ${digits.slice(2, 7)}`;
        if (digits.length > 7) {
          formattedValue += `-${digits.slice(7, 11)}`;
        }
      }
    }
    
    if (digits.length <= 11) {
      setPhone(formattedValue);
    }
  };

  const handleTypeChange = (value: string) => {
    const newType = value as 'PF' | 'PJ';
    setClientType(newType);
    setDocument('');
  };

  const handleConsultarCNPJ = async () => {
    if (clientType !== 'PJ' || document.length < 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ completo para consultar",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const resultado = await consultarCNPJ(document);
      
      if (resultado.status === 'success') {
        setName(resultado.nome || '');
        setEmail(resultado.email || '');
        setPhone(resultado.telefone || '');
        
        toast({
          title: "CNPJ consultado com sucesso",
          description: "Os dados da empresa foram preenchidos automaticamente"
        });
      } else {
        toast({
          title: "Erro na consulta",
          description: resultado.error || "Não foi possível consultar o CNPJ",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "Ocorreu um erro ao consultar o CNPJ",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomClient = () => {
    if (!name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o nome/razão social do cliente",
        variant: "destructive"
      });
      return;
    }
    
    if (!document.trim() || 
        (clientType === 'PF' && cleanDocumentValue(document).length !== 11) ||
        (clientType === 'PJ' && cleanDocumentValue(document).length !== 14)) {
      toast({
        title: "Documento inválido",
        description: clientType === 'PF' ? "Digite um CPF válido" : "Digite um CNPJ válido",
        variant: "destructive"
      });
      return;
    }
    
    if (!responsible.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o responsável pela proposta",
        variant: "destructive"
      });
      return;
    }

    const customClient = createCustomClient({
      name,
      document: cleanDocumentValue(document),
      type: clientType,
      email: email.trim() || undefined,
      phone: cleanDocumentValue(phone) || undefined,
      contactPerson: contactPerson.trim() || undefined
    });
    
    if (customClient) {
      onClientSelect(customClient);
      
      toast({
        title: "Cliente adicionado",
        description: "O cliente foi adicionado à proposta com sucesso"
      });
    }
  };

  const handleSelectExistingClient = (client: Client) => {
    onClientSelect(client);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="responsible" className="text-base font-medium">Responsável pela Proposta *</Label>
        <Input 
          id="responsible"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
          placeholder="Nome do responsável pela proposta"
          className="w-full"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="existing">Cliente Cadastrado</TabsTrigger>
          <TabsTrigger value="new">Novo Cliente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="existing" className="pt-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  quoteForm.client?.id === client.id
                    ? 'border-primary/70 ring-1 ring-primary/30 shadow-sm'
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() => handleSelectExistingClient(client)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.type === 'PJ' ? 'CNPJ' : 'CPF'}: {formatDocument(client.document)}
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
        </TabsContent>
        
        <TabsContent value="new" className="pt-4 space-y-4 animate-fadeIn">
          <div className="space-y-4">
            <RadioGroup 
              value={clientType} 
              onValueChange={handleTypeChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PJ" id="client-pj" />
                <Label htmlFor="client-pj">Pessoa Jurídica (CNPJ)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PF" id="client-pf" />
                <Label htmlFor="client-pf">Pessoa Física (CPF)</Label>
              </div>
            </RadioGroup>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document" className="text-sm">
                  {clientType === 'PJ' ? 'CNPJ *' : 'CPF *'}
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="document"
                    value={document}
                    onChange={handleDocumentChange}
                    placeholder={clientType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="w-full"
                  />
                  {clientType === 'PJ' && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleConsultarCNPJ}
                      disabled={isLoading || cleanDocumentValue(document).length !== 14}
                    >
                      {isLoading ? 'Consultando...' : 'Consultar'}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Digite apenas os números</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  {clientType === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={clientType === 'PJ' ? 'Razão social da empresa' : 'Nome completo'}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Digite apenas os números</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm">Pessoa Responsável</Label>
                <Input
                  id="contactPerson"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Nome da pessoa de contato"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                type="button" 
                onClick={handleCreateCustomClient}
                className="w-full md:w-auto"
              >
                Adicionar Cliente
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientForm;
