import React, { useState, useEffect } from 'react';
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
import { Loader2, AlertCircle } from 'lucide-react';
import { 
  fetchVehicleGroups, 
  addVehicleGroup, 
  updateVehicleGroup, 
  deleteVehicleGroup,
  fetchCalculationParams,
  updateCalculationParams,
  VehicleGroup,
  CalculationParams
} from '@/lib/settings';
import ProtectionPlansTab from '@/components/protection/ProtectionPlansTab';
import DepreciationParametersForm from '@/components/settings/DepreciationParametersForm';

const vehicleGroupSchema = z.object({
  code: z.string().min(1, { message: 'Código do grupo é obrigatório' }).max(3, { message: 'Código deve ter no máximo 3 caracteres' }),
  name: z.string().min(1, { message: 'Nome do grupo é obrigatório' }),
  description: z.string().optional(),
  revision_km: z.number().min(1, { message: 'Intervalo de revisão é obrigatório' }),
  revision_cost: z.number().min(1, { message: 'Custo de revisão é obrigatório' }),
  tire_km: z.number().min(1, { message: 'Intervalo de troca de pneus é obrigatório' }),
  tire_cost: z.number().min(1, { message: 'Custo de troca de pneus é obrigatório' }),
  ipva_cost: z.number().min(0, { message: 'Percentual do IPVA deve ser positivo' }).max(0.2, { message: 'Percentual do IPVA deve ser entre 0 e 20%' }),
  licensing_cost: z.number().min(0, { message: 'Valor do Licenciamento deve ser positivo' }),
});

const globalParamsSchema = z.object({
  tracking_cost: z.number().min(0, { message: 'Valor de rastreamento deve ser positivo' }),
  extra_km_percentage: z.number().min(0, { message: 'Percentual de km extra deve ser positivo' }),
});

type VehicleGroupFormValues = z.infer<typeof vehicleGroupSchema>;
type GlobalFormValues = z.infer<typeof globalParamsSchema>;

const Parameters = () => {
  const [groups, setGroups] = useState<VehicleGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState('');
  const [currentTab, setCurrentTab] = useState<string>('vehicle-groups');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingParams, setLoadingParams] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingParams, setSavingParams] = useState(false);
  const [calculationParamsId, setCalculationParamsId] = useState<string | undefined>();
  const { toast } = useToast();

  const groupForm = useForm<VehicleGroupFormValues>({
    resolver: zodResolver(vehicleGroupSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      revision_km: 10000,
      revision_cost: 300,
      tire_km: 40000,
      tire_cost: 1200,
      ipva_cost: 0.03,
      licensing_cost: 0,
    },
  });

  const globalForm = useForm<GlobalFormValues>({
    resolver: zodResolver(globalParamsSchema),
    defaultValues: {
      tracking_cost: 50,
      extra_km_percentage: 0.0000075,
    },
  });

  useEffect(() => {
    loadVehicleGroups();
    loadCalculationParams();
  }, []);

  const loadVehicleGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await fetchVehicleGroups();
      setGroups(data);
    } catch (error) {
      console.error('Erro ao carregar grupos de veículos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os grupos de veículos',
        variant: 'destructive',
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadCalculationParams = async () => {
    setLoadingParams(true);
    try {
      const params = await fetchCalculationParams();
      
      if (params) {
        setCalculationParamsId(params.id);
        
        globalForm.reset({
          tracking_cost: params.tracking_cost,
          extra_km_percentage: params.extra_km_percentage,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros de cálculo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os parâmetros de cálculo',
        variant: 'destructive',
      });
    } finally {
      setLoadingParams(false);
    }
  };

  const handleAddGroup = () => {
    groupForm.reset({
      code: '',
      name: '',
      description: '',
      revision_km: 10000,
      revision_cost: 300,
      tire_km: 40000,
      tire_cost: 1200,
      ipva_cost: 0.03,
      licensing_cost: 0,
    });
    setEditMode(false);
    setIsDialogOpen(true);
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      groupForm.reset({
        code: group.code,
        name: group.name,
        description: group.description,
        revision_km: group.revision_km,
        revision_cost: group.revision_cost,
        tire_km: group.tire_km,
        tire_cost: group.tire_cost,
        ipva_cost: group.ipva_cost || 0,
        licensing_cost: group.licensing_cost || 0,
      });
      setCurrentGroupId(groupId);
      setEditMode(true);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const success = await deleteVehicleGroup(groupId);
      if (success) {
        setGroups(groups.filter(group => group.id !== groupId));
        toast({
          title: "Sucesso",
          description: "Grupo de veículo excluído com sucesso",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o grupo de veículo",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o grupo de veículo",
        variant: 'destructive',
      });
    }
  };

  const onSubmitGroup = async (values: VehicleGroupFormValues) => {
    setSavingGroup(true);
    try {
      if (editMode) {
        const success = await updateVehicleGroup(currentGroupId, values);
        if (success) {
          setGroups(prev => prev.map(group => 
            group.id === currentGroupId ? { ...group, ...values } : group
          ));
          
          toast({
            title: "Sucesso",
            description: "Grupo de veículo atualizado com sucesso",
          });
          setIsDialogOpen(false);
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível atualizar o grupo de veículo",
            variant: 'destructive',
          });
        }
      } else {
        if (groups.some(group => group.code === values.code)) {
          toast({
            title: 'Erro',
            description: 'Este código já está em uso. Por favor, escolha outro código para o grupo.',
            variant: 'destructive',
          });
          return;
        }
        
        const newGroupData: Omit<VehicleGroup, 'id' | 'created_at' | 'updated_at'> = {
          code: values.code,
          name: values.name,
          description: values.description || '',
          revision_km: values.revision_km,
          revision_cost: values.revision_cost,
          tire_km: values.tire_km,
          tire_cost: values.tire_cost,
          ipva_cost: values.ipva_cost,
          licensing_cost: values.licensing_cost
        };
        
        const newGroup = await addVehicleGroup(newGroupData);
        if (newGroup) {
          setGroups(prev => [...prev, newGroup]);
          toast({
            title: "Sucesso",
            description: "Grupo de veículo adicionado com sucesso",
          });
          setIsDialogOpen(false);
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível adicionar o grupo de veículo",
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar grupo de veículo:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o grupo de veículo",
        variant: 'destructive',
      });
    } finally {
      setSavingGroup(false);
    }
  };

  const onGlobalParamsSubmit = async (values: GlobalFormValues) => {
    setSavingParams(true);
    try {
      // Buscar parâmetros existentes para preservar outros valores
      const existingParams = await fetchCalculationParams();
      
      // Combinar valores existentes com os novos (preservando os parâmetros de depreciação)
      const updatedParams: CalculationParams = {
        id: calculationParamsId,
        tracking_cost: values.tracking_cost,
        depreciation_base: existingParams?.depreciation_base || 0.015,
        depreciation_mileage_multiplier: existingParams?.depreciation_mileage_multiplier || 0.05,
        depreciation_severity_multiplier: existingParams?.depreciation_severity_multiplier || 0.1,
        extra_km_percentage: values.extra_km_percentage,
        // Manter os campos de depreciação personalizados
        depreciation_base_rate: existingParams?.depreciation_base_rate,
        severity_multiplier_1: existingParams?.severity_multiplier_1,
        severity_multiplier_2: existingParams?.severity_multiplier_2,
        severity_multiplier_3: existingParams?.severity_multiplier_3,
        severity_multiplier_4: existingParams?.severity_multiplier_4,
        severity_multiplier_5: existingParams?.severity_multiplier_5,
        severity_multiplier_6: existingParams?.severity_multiplier_6,
      };
      
      const success = await updateCalculationParams(updatedParams);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Parâmetros globais atualizados com sucesso",
        });
        
        loadCalculationParams();
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar os parâmetros globais",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar parâmetros globais:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar os parâmetros globais",
        variant: 'destructive',
      });
    } finally {
      setSavingParams(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-8">
        <PageTitle 
          title="Parâmetros do Sistema" 
          subtitle="Configure os grupos de veículos, parâmetros gerais e planos de proteção" 
        />
        
        <Tabs defaultValue="vehicle-groups" value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="vehicle-groups">Grupos de Veículos</TabsTrigger>
            <TabsTrigger value="global-params">Parâmetros Globais</TabsTrigger>
            <TabsTrigger value="depreciation-params">Depreciação</TabsTrigger>
            <TabsTrigger value="protection-plans">Planos de Proteção</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vehicle-groups" className="space-y-4">
            <Card>
              <CardHeader title="Grupos de Veículos" />
              {loadingGroups ? (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>Carregando grupos de veículos...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">Nenhum grupo encontrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você ainda não possui grupos de veículos cadastrados.
                  </p>
                  <Button onClick={handleAddGroup}>Adicionar Grupo</Button>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {groups.map((group) => (
                    <div key={group.id} className="flex justify-between items-center p-4 border rounded-md">
                      <div>
                        <h3 className="font-medium">{group.name} ({group.code})</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Revisão: {group.revision_km.toLocaleString()} km (R$ {group.revision_cost})</span>
                          <span>Pneus: {group.tire_km.toLocaleString()} km (R$ {group.tire_cost})</span>
                          <span>IPVA: {((group.ipva_cost || 0) * 100).toFixed(2)}% a.a.</span>
                          <span>Licenciamento: R$ {(group.licensing_cost || 0).toFixed(2)}/ano</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditGroup(group.id)}>Editar</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id)}>Excluir</Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end p-4">
                    <Button onClick={handleAddGroup}>Adicionar Grupo</Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="global-params" className="space-y-4">
            <Card>
              <CardHeader title="Parâmetros Globais de Cálculo" />
              <div className="p-4">
                {loadingParams ? (
                  <div className="flex justify-center items-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span>Carregando parâmetros globais...</span>
                  </div>
                ) : (
                  <Form {...globalForm}>
                    <form onSubmit={globalForm.handleSubmit(onGlobalParamsSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={globalForm.control}
                          name="tracking_cost"
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
                          name="extra_km_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentual do Valor do Veículo para KM Extra</FormLabel>
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
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={savingParams}
                        >
                          {savingParams ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Salvando Parâmetros...
                            </>
                          ) : (
                            <>Salvar Parâmetros</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="depreciation-params" className="space-y-4">
            <Card>
              <CardHeader title="Parâmetros de Depreciação" subtitle="Configure os valores usados na fórmula de depreciação" />
              <div className="p-4">
                <DepreciationParametersForm />
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="protection-plans" className="space-y-4">
            <ProtectionPlansTab />
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Editar Grupo de Veículo' : 'Adicionar Grupo de Veículo'}</DialogTitle>
          </DialogHeader>
          
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(onSubmitGroup)} className="space-y-4">
              <FormField
                control={groupForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Grupo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={editMode} maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={groupForm.control}
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
                control={groupForm.control}
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
                  control={groupForm.control}
                  name="revision_km"
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
                  control={groupForm.control}
                  name="revision_cost"
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
                  control={groupForm.control}
                  name="tire_km"
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
                  control={groupForm.control}
                  name="tire_cost"
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={groupForm.control}
                  name="ipva_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IPVA (% do valor do veículo)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="0.2"
                          step="0.001" 
                          {...field} 
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= 0 && value <= 0.2) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Ex: 0.024 = 2.4% do valor do veículo (valores válidos: 0 a 20%)
                      </p>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={groupForm.control}
                  name="licensing_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Anual do Licenciamento (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={savingGroup}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={savingGroup}
                >
                  {savingGroup ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {editMode ? 'Salvando...' : 'Adicionando...'}
                    </>
                  ) : (
                    editMode ? 'Salvar Alterações' : 'Adicionar Grupo'
                  )}
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
