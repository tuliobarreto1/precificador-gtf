
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, RefreshCw, Database, Loader2 } from 'lucide-react';
import { fetchSystemSettings, updateSystemSettings, SystemSetting } from '@/lib/settings';

const generalFormSchema = z.object({
  companyName: z.string().min(2, { message: 'Nome da empresa é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().min(10, { message: 'Telefone inválido' }),
  address: z.string().min(5, { message: 'Endereço é obrigatório' }),
  enableNotifications: z.boolean().default(true),
  defaultContractLength: z.number().min(6).max(36),
});

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settingsMap, setSettingsMap] = useState<Record<string, SystemSetting>>({});
  
  // General settings form
  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      companyName: 'Car Lease Master',
      email: 'contato@carleasemaster.com.br',
      phone: '(11) 99999-9999',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      enableNotifications: true,
      defaultContractLength: 12,
    },
  });

  // Carregar configurações do banco
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const settings = await fetchSystemSettings();
        
        // Criar mapa de configurações para facilitar o acesso
        const newSettingsMap = settings.reduce((map, setting) => {
          map[setting.key] = setting;
          return map;
        }, {} as Record<string, SystemSetting>);
        
        setSettingsMap(newSettingsMap);
        
        // Atualizar formulário com os valores do banco
        generalForm.reset({
          companyName: newSettingsMap['company_name']?.value || 'Car Lease Master',
          email: newSettingsMap['company_email']?.value || 'contato@carleasemaster.com.br',
          phone: newSettingsMap['company_phone']?.value || '(11) 99999-9999',
          address: newSettingsMap['company_address']?.value || 'Av. Paulista, 1000 - São Paulo, SP',
          enableNotifications: newSettingsMap['enable_notifications']?.value === 'true',
          defaultContractLength: parseInt(newSettingsMap['default_contract_length']?.value || '12'),
        });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Não foi possível carregar as configurações do sistema');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const onGeneralSubmit = async (values: z.infer<typeof generalFormSchema>) => {
    setLoading(true);
    try {
      // Preparar objeto de configurações para atualização
      const settingsToUpdate = {
        company_name: values.companyName,
        company_email: values.email,
        company_phone: values.phone,
        company_address: values.address,
        enable_notifications: values.enableNotifications.toString(),
        default_contract_length: values.defaultContractLength.toString(),
      };
      
      const success = await updateSystemSettings(settingsToUpdate);
      
      if (success) {
        toast.success('Configurações gerais salvas com sucesso');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Ocorreu um erro ao salvar as configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageTitle 
        title="Configurações" 
        subtitle="Gerencie as configurações gerais do sistema"
      />

      <Card>
        <CardHeader 
          title="Configurações Gerais" 
          subtitle="Configure os parâmetros básicos do sistema"
        />
        <div className="p-6 pt-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando configurações...</span>
            </div>
          ) : (
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={generalForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={generalForm.control}
                  name="enableNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Notificações</FormLabel>
                        <FormDescription>
                          Ativar notificações para novos orçamentos e atualizações
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="defaultContractLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração Padrão do Contrato (meses): {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={6}
                          max={36}
                          step={6}
                          defaultValue={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Define a duração padrão dos contratos em meses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => generalForm.reset()}
                    disabled={loading}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Redefinir
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </Card>

      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm" asChild>
          <a href="https://supabase.com/dashboard/project/pvsjjqmsoauuxxfgdhfg/editor" target="_blank" rel="noopener noreferrer">
            <Database size={16} className="mr-2" />
            Gerenciar Configurações no Supabase
          </a>
        </Button>
      </div>
    </MainLayout>
  );
};

export default Settings;
