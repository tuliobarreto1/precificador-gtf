import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveClientToSupabase, updateClientInSupabase } from '@/integrations/supabase/services/clients';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface NewClientFormProps {
  onSave: (client: any) => void;
  onCancel: () => void;
  client?: any;
  isEdit?: boolean;
}

export default function NewClientForm({ onSave, onCancel, client, isEdit }: NewClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    document: '',
    name: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    responsible_person: '',
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
        phone: client.phone || '',
        cep: client.cep ? formatCEP(client.cep.toString()) : '',
        address: client.address || '',
        number: client.number || '',
        complement: client.complement || '',
        city: client.city || '',
        state: client.state || '',
        responsible_person: client.responsible_person || '',
        type: client.document?.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'
      });
    }
  }, [isEdit, client]);

  const documentType = formData.document.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ';
  const { toast } = useToast();

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const searchCEP = async (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
      if (!response.ok) throw new Error('Falha ao buscar CEP');
      
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        address: data.logradouro,
        city: data.localidade,
        state: data.uf,
        complement: data.complemento || prev.complement,
      }));

      toast({
        title: "CEP encontrado",
        description: "Endereço preenchido automaticamente",
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    setFormData(prev => ({ ...prev, cep: formatted }));

    // Buscar CEP quando completar 8 dígitos
    if (value.replace(/\D/g, '').length === 8) {
      searchCEP(value);
    }
  };

  const searchCNPJ = async (numbers: string) => {
    if (numbers.length !== 14) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${numbers}`);
      if (!response.ok) throw new Error('Falha ao buscar CNPJ');
      
      const data = await response.json();
      if (data.estabelecimento.cep) {
        handleCEPChange(data.estabelecimento.cep);
      }
      
      setFormData(prev => ({
        ...prev,
        name: data.razao_social,
        type: 'PJ',
        number: data.estabelecimento.numero || '',
        complement: data.estabelecimento.complemento || '',
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

      // Preparar dados para salvar
      const saveData = {
        ...formData,
        cep: formData.cep ? parseInt(formData.cep.replace(/\D/g, '')) : null,
      };

      let result;
      if (isEdit) {
        result = await updateClientInSupabase(formData.id, {
          ...saveData,
          updated_at: new Date().toISOString()
        });
      } else {
        result = await saveClientToSupabase(saveData);
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
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações Básicas</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
                disabled={loading || isEdit}
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
          </div>
        </div>

        <Separator />

        {/* Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações de Contato</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                disabled={loading}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Endereço</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  disabled={loading || loadingCep}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loadingCep && (
                  <Loader2 className="absolute right-2 top-2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                disabled={loading}
                maxLength={2}
                placeholder="UF"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="address">Logradouro</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              disabled={loading}
              placeholder="Nome da rua"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                disabled={loading}
                placeholder="Apto, Sala, etc."
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Responsável */}
        <div>
          <Label htmlFor="responsible_person">Pessoa Responsável</Label>
          <Input
            id="responsible_person"
            value={formData.responsible_person}
            onChange={(e) => setFormData(prev => ({ ...prev, responsible_person: e.target.value }))}
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
