import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client, addClient, getClientByDocument } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface NewClientFormProps {
  onSave: (client: Client) => void;
  onCancel: () => void;
}

export default function NewClientForm({ onSave, onCancel }: NewClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    document: '',
    name: '',
    email: '',
    contact: '',
    responsible: '',
  });

  const documentType = formData.document.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ';
  const { toast } = useToast();

  const formatDocument = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Detecta o tipo pelo número de dígitos
    if (numbers.length <= 11) {
      // Formato CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      // Formato CNPJ: 00.000.000/0001-00
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

    // Se for CNPJ (14 dígitos) busca automaticamente
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 14) {
      searchCNPJ(numbers);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.document || !formData.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Verificar se já existe um cliente com o mesmo documento
    const existingClient = getClientByDocument(formData.document);
    if (existingClient) {
      toast({
        title: "Cliente já cadastrado",
        description: "Já existe um cliente cadastrado com este documento.",
        variant: "destructive",
      });
      return;
    }

    // Criar e salvar novo cliente
    const newClient: Client = {
      id: Date.now().toString(),
      name: formData.name,
      type: documentType,
      document: formData.document,
      email: formData.email || undefined,
    };

    const savedClient = addClient(newClient);
    onSave(savedClient);
  };

  return (
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
            onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
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

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Cliente
        </Button>
      </div>
    </form>
  );
}
