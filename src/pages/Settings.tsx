
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, RefreshCw, Database, Car, Wrench } from 'lucide-react';

const generalFormSchema = z.object({
  companyName: z.string().min(2, { message: 'Nome da empresa é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().min(10, { message: 'Telefone inválido' }),
  address: z.string().min(5, { message: 'Endereço é obrigatório' }),
  enableNotifications: z.boolean().default(true),
  defaultContractLength: z.number().min(6).max(36),
});

const vehicleFormSchema = z.object({
  defaultDepreciationRate: z.number().min(0.1).max(5),
  defaultMileage: z.number().min(500).max(10000),
  defaultMaintenanceInterval: z.number().min(5000).max(20000),
  enableFipeIntegration: z.boolean().default(true),
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

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

  // Vehicle settings form
  const vehicleForm = useForm<z.infer<typeof vehicleFormSchema>>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      defaultDepreciationRate: 1.5,
      defaultMileage: 1500,
      defaultMaintenanceInterval: 10000,
      enableFipeIntegration: true,
    },
  });

  const onGeneralSubmit = (values: z.infer<typeof generalFormSchema>) => {
    console.log(values);
    toast.success('Configurações gerais salvas com sucesso');
  };

  const onVehicleSubmit = (values: z.infer<typeof vehicleFormSchema>) => {
    console.log(values);
    toast.success('Configurações de veículos salvas com sucesso');
  };

  return (
    <MainLayout>
      <PageTitle 
        title="Configurações" 
        subtitle="Gerencie as configurações do sistema de precificação"
      />

      <Tabs defaultValue="general" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:w-[400px]">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Database size={16} />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <Car size={16} />
            <span>Veículos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader 
              title="Configurações Gerais" 
              subtitle="Configure os parâmetros básicos do sistema"
            />
            <div className="p-6 pt-0">
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
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Redefinir
                    </Button>
                    <Button type="submit">
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vehicle">
          <Card>
            <CardHeader 
              title="Configurações de Veículos" 
              subtitle="Configure os parâmetros relacionados aos veículos"
            />
            <div className="p-6 pt-0">
              <Form {...vehicleForm}>
                <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-6">
                  <FormField
                    control={vehicleForm.control}
                    name="defaultDepreciationRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Depreciação Padrão (%): {field.value}%</FormLabel>
                        <FormControl>
                          <Slider
                            min={0.1}
                            max={5}
                            step={0.1}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Define a taxa de depreciação mensal padrão para veículos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vehicleForm.control}
                    name="defaultMileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quilometragem Mensal Padrão: {field.value} km</FormLabel>
                        <FormControl>
                          <Slider
                            min={500}
                            max={10000}
                            step={100}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Define a quilometragem mensal padrão
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vehicleForm.control}
                    name="defaultMaintenanceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo de Manutenção Padrão: {field.value} km</FormLabel>
                        <FormControl>
                          <Slider
                            min={5000}
                            max={20000}
                            step={1000}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Define o intervalo de manutenção padrão em quilômetros
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vehicleForm.control}
                    name="enableFipeIntegration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Integração com Tabela FIPE</FormLabel>
                          <FormDescription>
                            Habilitar integração automática com a tabela FIPE
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

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => vehicleForm.reset()}
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Redefinir
                    </Button>
                    <Button type="submit">
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Settings;
