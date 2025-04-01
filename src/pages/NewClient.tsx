
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Card, CardContent } from '@/components/ui/card';
import NewClientForm from '@/components/client/NewClientForm';
import { useToast } from '@/hooks/use-toast';
import { saveClientToSupabase } from '@/integrations/supabase';

export default function NewClient() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = async (newClient: any) => {
    try {
      const { success, error, data } = await saveClientToSupabase(newClient);
      
      if (success) {
        toast({
          title: "Cliente criado",
          description: "O cliente foi criado com sucesso!",
        });
        navigate('/clientes');
      } else {
        throw error;
      }
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Ocorreu um erro ao tentar criar o cliente",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate('/clientes');
  };

  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle
          title="Novo Cliente"
          subtitle="Cadastre um novo cliente no sistema"
          className="mb-6"
        />

        <Card>
          <CardContent className="pt-6">
            <NewClientForm
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
