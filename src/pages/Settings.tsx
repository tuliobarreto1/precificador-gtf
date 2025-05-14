
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaxParametersForm from '@/components/settings/TaxParametersForm';
import DepreciationParametersForm from '@/components/settings/DepreciationParametersForm';
import EmailSettingsForm from '@/components/settings/EmailSettingsForm';
import { Skeleton } from '@/components/ui/skeleton';

const Settings = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular o carregamento das configurações
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <MainLayout>
      <PageTitle 
        title="Configurações do Sistema" 
        subtitle="Gerencie todos os parâmetros e configurações do sistema" 
        breadcrumbs={[
          { label: 'Home', url: '/' },
          { label: 'Configurações', url: '/configuracoes' }
        ]}
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <Tabs defaultValue="tax" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tax">Índices e Taxas</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciação</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tax" className="space-y-4">
            <TaxParametersForm />
          </TabsContent>
          
          <TabsContent value="depreciation" className="space-y-4">
            <DepreciationParametersForm />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <EmailSettingsForm />
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  );
};

export default Settings;
