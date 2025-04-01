import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Card, CardContent } from '@/components/ui/card';
import NewClientForm from '@/components/client/NewClientForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const handleSave = (updatedClient: any) => {
    toast({
      title: "Cliente atualizado",
      description: "Os dados do cliente foram atualizados com sucesso",
    });
    navigate('/clientes');
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
