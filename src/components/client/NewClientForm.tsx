import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveClientToSupabase, updateClientInSupabase } from '@/integrations/supabase/services/clients';

interface NewClientFormProps {
  onSave: (client: any) => void;
  onCancel: () => void;
  client?: any; // Cliente para edição
  isEdit?: boolean;
}

export default function NewClientForm({ onSave, onCancel, client, isEdit }: NewClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    document: '',
    name: '',
    email: '',
    contact: '',
    phone: '',
    responsible: '',
    type: 'PF'
  });

  // Carregar dados do cliente se estiver em modo de edição
  useEffect(() => {
    if (isEdit && client) {
      setFormData({
        id: client.id || '',
        document: client.document || '',
        name: client.name || '',
        email: client.email || '',
        contact: client.contact || '',
        phone: client.phone || '',
        responsible: client.responsible || '',
        type: client.document?.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'
      });
    }
  }, [isEdit, client]);

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
        type: 'PJ'
      }));
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value);
    setFormData(prev => ({ 
      ...prev, 
      document: formatted,
      type: formatted.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'
    }));

    // Se for CNPJ (14 dígitos) busca automaticamente
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 14) {
      searchCNPJ(numbers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.document || !formData.name) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      let result;
      if (isEdit) {
        // Atualizar cliente existente
        result = await updateClientInSupabase(formData.id, {
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          type: formData.type,
          updated_at: new Date().toISOString()
        });
      } else {
        // Criar novo cliente
        result = await saveClientToSupabase({
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          type: formData.type
        });
      }

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao salvar cliente');
      }

      toast({
        title: isEdit ? "Cliente atualizado" : "Cliente criado",
        description: isEdit ? "Cliente atualizado com sucesso!" : "Novo cliente criado com sucesso!",
      });

      onSave(result.data);
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            disabled={loading || isEdit} // Desabilitar edição do documento em modo de edição
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
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="responsible">Pessoa Responsável</Label>
          <Input
            id="responsible"
            value={formData.responsible}
            onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar Cliente')}
        </Button>
      </div>
    </form>
  );
}
