
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Card, CardContent } from '@/components/ui/card';
import NewClientForm from '@/components/client/NewClientForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase';

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadClient(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadClient = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data) {
        setClient(data);
      } else {
        throw new Error('Cliente não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente",
        variant: "destructive",
      });
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedClient: any) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: updatedClient.name,
          type: updatedClient.type || 'PF',
          document: updatedClient.document,
          email: updatedClient.email,
          phone: updatedClient.phone,
          address: updatedClient.address,
          city: updatedClient.city,
          state: updatedClient.state,
          cep: updatedClient.cep,
          complement: updatedClient.complement,
          number: updatedClient.number,
          responsible_person: updatedClient.responsiblePerson || updatedClient.responsible_person,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso",
      });
      navigate('/clientes');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados do cliente",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate('/clientes');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="text-center">Carregando dados do cliente...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle
          title="Editar Cliente"
          subtitle="Atualize os dados do cliente"
          className="mb-6"
        />

        <Card>
          <CardContent className="pt-6">
            <NewClientForm
              client={client}
              isEdit={true}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
