
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { vehicleGroups, VehicleGroup } from '@/lib/mock-data';
import { getGlobalParams, updateGlobalParams, GlobalParams } from '@/lib/calculation';

// Form schema for vehicle groups
const vehicleGroupSchema = z.object({
  id: z.string().min(1, { message: 'ID do grupo é obrigatório' }),
  name: z.string().min(1, { message: 'Nome do grupo é obrigatório' }),
  description: z.string().optional(),
  revisionKm: z.number().min(1, { message: 'Intervalo de revisão é obrigatório' }),
  revisionCost: z.number().min(1, { message: 'Custo de revisão é obrigatório' }),
  tireKm: z.number().min(1, { message: 'Intervalo de troca de pneus é obrigatório' }),
  tireCost: z.number().min(1, { message: 'Custo de troca de pneus é obrigatório' }),
});

// Form schema for global params
const globalParamsSchema = z.object({
  trackingCost: z.number().min(0, { message: 'Valor de rastreamento deve ser positivo' }),
  depreciationBase: z.number().min(0.001, { message: 'Taxa base de depreciação deve ser positiva' }),
  depreciationMileageMultiplier: z.number().min(0, { message: 'Multiplicador de quilometragem deve ser positivo' }),
  depreciationSeverityMultiplier: z.number().min(0, { message: 'Multiplicador de severidade deve ser positivo' }),
  extraKmPercentage: z.number().min(0, { message: 'Percentual de km extra deve ser positivo' }),
});

type FormValues = z.infer<typeof vehicleGroupSchema>;
type GlobalFormValues = z.infer<typeof globalParamsSchema>;

const Parameters = () => {
  const [groups, setGroups] = useState<VehicleGroup[]>(vehicleGroups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState('');
  const [currentTab, setCurrentTab] = useState<string>('vehicle-groups');
  const { toast } = useToast();
  const globalParams = getGlobalParams();

  // Form for vehicle groups
  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleGroupSchema),
    defaultValues: {
      id: '',
      name: '',
      description: '',
      revisionKm: 10000,
      revisionCost: 300,
      tireKm: 40000,
      tireCost: 1200,
    },
  });

  // Form for global parameters
  const globalForm = useForm<GlobalFormValues>({
    resolver: zodResolver(globalParamsSchema),
    defaultValues: {
      trackingCost: globalParams.trackingCost,
      depreciationBase: globalParams.depreciationRates.base,
      depreciationMileageMultiplier: globalParams.depreciationRates.mileageMultiplier,
      depreciationSeverityMultiplier: globalParams.depreciationRates.severityMultiplier,
      extraKmPercentage: globalParams.extraKmPercentage,
    },
  });

  // Handle opening the dialog for adding/editing
  const handleAddGroup = () => {
    form.reset({
      id: '',
      name: '',
      description: '',
      revisionKm: 10000,
      revisionCost: 300,
      tireKm: 40000,
      tireCost: 1200,
    });
    setEditMode(false);
    setIsDialogOpen(true);
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      form.reset({
        id: group.id,
        name: group.name,
        description: group.description,
        revisionKm: group.revisionKm,
        revisionCost: group.revisionCost,
        tireKm: group.tireKm,
        tireCost: group.tireCost,
      });
      setCurrentGroupId(groupId);
      setEditMode(true);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
    toast({
      title: "Sucesso",
      description: "Grupo de veículo excluído com sucesso",
    });
  };

  // Form submission for vehicle groups
  const onSubmit = (values: FormValues) => {
    if (editMode) {
      setGroups(groups.map(group => 
        group.id === currentGroupId ? {
          id: values.id,
          name: values.name,
          description: values.description || '', // Ensure description is not undefined
          revisionKm: values.revisionKm,
          revisionCost: values.revisionCost,
          tireKm: values.tireKm,
          tireCost: values.tireCost,
        } : group
      ));
      toast({
        title: "Sucesso",
        description: "Grupo de veículo atualizado com sucesso",
      });
    } else {
      // Check if the ID is already in use
      if (groups.some(group => group.id === values.id)) {
        toast({
          title: 'Erro ao adicionar grupo',
          description: 'Este ID já está em uso. Por favor, escolha outro ID para o grupo.',
          variant: 'destructive',
        });
        return;
      }
      
      // Ensure the new vehicle group has all required properties
      const newGroup: VehicleGroup = {
        id: values.id,
        name: values.name,
        description: values.description || '', // Ensure description is not undefined
        revisionKm: values.revisionKm,
        revisionCost: values.revisionCost,
        tireKm: values.tireKm,
        tireCost: values.tireCost,
      };
      
      setGroups([...groups, newGroup]);
      toast({
        title: "Sucesso",
        description: "Grupo de veículo adicionado com sucesso",
      });
    }
    setIsDialogOpen(false);
  };

  // Form submission for global parameters
  const onGlobalParamsSubmit = (values: GlobalFormValues) => {
    updateGlobalParams({
      trackingCost: values.trackingCost,
      depreciationRates: {
        base: values.depreciationBase,
        mileageMultiplier: values.depreciationMileageMultiplier,
        severityMultiplier: values.depreciationSeverityMultiplier,
      },
      extraKmPercentage: values.extraKmPercentage,
    });
    toast({
      title: "Sucesso",
      description: "Parâmetros globais atualizados com sucesso",
    });
  };

  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle 
          title="Parâmetros do Sistema" 
          subtitle="Configure os grupos de veículos e parâmetros gerais de cálculo" 
        />
        
        <Tabs defaultValue="vehicle-groups" value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="vehicle-groups">Grupos de Veículos</TabsTrigger>
            <TabsTrigger value="global-params">Parâmetros Globais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vehicle-groups" className="space-y-4">
            <Card>
              <CardHeader title="Grupos de Veículos" />
              <div className="space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h3 className="font-medium">{group.name} ({group.id})</h3>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                      <div className="mt-1 flex space-x-4 text-xs text-muted-foreground">
                        <span>Revisão: {group.revisionKm.toLocaleString()} km (R$ {group.revisionCost})</span>
                        <span>Pneus: {group.tireKm.toLocaleString()} km (R$ {group.tireCost})</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditGroup(group.id)}>Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id)}>Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end p-4">
                <Button onClick={handleAddGroup}>Adicionar Grupo</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="global-params" className="space-y-4">
            <Card>
              <CardHeader title="Parâmetros Globais de Cálculo" />
              <div className="p-4">
                <Form {...globalForm}>
                  <form onSubmit={globalForm.handleSubmit(onGlobalParamsSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={globalForm.control}
                        name="trackingCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo Mensal de Rastreamento (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} 
                                onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={globalForm.control}
                        name="extraKmPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Percentual do Valor do Veículo para KM Extra (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0000001" 
                                min="0" 
                                {...field} 
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Ex: 0.0000075 = 0,00075% do valor do veículo será cobrado por quilômetro excedente
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">Taxas de Depreciação</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={globalForm.control}
                          name="depreciationBase"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Taxa Base</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  min="0.001" 
                                  {...field} 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Taxa base de depreciação mensal
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={globalForm.control}
                          name="depreciationMileageMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Multiplicador de Quilometragem</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  {...field} 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Impacto da quilometragem na depreciação
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={globalForm.control}
                          name="depreciationSeverityMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Multiplicador de Severidade</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  {...field} 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Impacto da severidade de uso na depreciação
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit">Salvar Parâmetros</Button>
                    </div>
                  </form>
                </Form>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog for adding/editing vehicle groups */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Editar Grupo de Veículo' : 'Adicionar Grupo de Veículo'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Grupo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={editMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Grupo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revisionKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Revisão (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="revisionCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo de Revisão (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tireKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Troca de Pneus (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tireCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo de Troca de Pneus (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editMode ? 'Salvar Alterações' : 'Adicionar Grupo'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Parameters;
