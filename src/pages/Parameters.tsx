
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Car, Wrench, Edit, Trash2, Plus, Save } from 'lucide-react';
import { vehicleGroups, VehicleGroup } from '@/lib/mock-data';

// Form schema for vehicle group
const vehicleGroupSchema = z.object({
  id: z.string().min(1, { message: 'ID é obrigatório' }),
  name: z.string().min(2, { message: 'Nome é obrigatório' }),
  description: z.string().optional(),
  revisionKm: z.number().min(1000, { message: 'Intervalo mínimo é 1.000 km' }),
  revisionCost: z.number().min(100, { message: 'Custo mínimo é R$ 100' }),
  tireKm: z.number().min(10000, { message: 'Intervalo mínimo é 10.000 km' }),
  tireCost: z.number().min(500, { message: 'Custo mínimo é R$ 500' }),
});

type FormValues = z.infer<typeof vehicleGroupSchema>;

const Parameters = () => {
  const [activeTab, setActiveTab] = useState('vehicleGroups');
  const [groups, setGroups] = useState<VehicleGroup[]>(vehicleGroups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // Form for vehicle group
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

  const handleAddGroup = () => {
    setEditMode(false);
    form.reset({
      id: '',
      name: '',
      description: '',
      revisionKm: 10000,
      revisionCost: 300,
      tireKm: 40000,
      tireCost: 1200,
    });
    setIsDialogOpen(true);
  };

  const handleEditGroup = (group: VehicleGroup) => {
    setEditMode(true);
    setCurrentGroupId(group.id);
    form.reset({
      id: group.id,
      name: group.name,
      description: group.description,
      revisionKm: group.revisionKm,
      revisionCost: group.revisionCost,
      tireKm: group.tireKm,
      tireCost: group.tireCost,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(group => group.id !== id));
    toast.success('Grupo de veículo removido com sucesso');
  };

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
      toast.success('Grupo de veículo atualizado com sucesso');
    } else {
      // Check if the ID already exists
      if (groups.some(group => group.id === values.id)) {
        form.setError('id', { 
          type: 'manual', 
          message: 'Este ID já está em uso' 
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
      toast.success('Grupo de veículo adicionado com sucesso');
    }
    setIsDialogOpen(false);
  };

  return (
    <MainLayout>
      <PageTitle 
        title="Parâmetros" 
        subtitle="Gerencie os parâmetros de cálculo por grupo de veículos"
      />

      <Tabs defaultValue="vehicleGroups" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:w-[400px]">
          <TabsTrigger value="vehicleGroups" className="flex items-center gap-2">
            <Car size={16} />
            <span>Grupos de Veículos</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench size={16} />
            <span>Manutenção</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicleGroups">
          <Card>
            <CardHeader 
              title="Grupos de Veículos" 
              subtitle="Configure os parâmetros de cada grupo de veículos"
              action={
                <Button onClick={handleAddGroup}>
                  <Plus size={16} className="mr-2" />
                  Novo Grupo
                </Button>
              }
            />
            <div className="p-6 pt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Revisão (km)</TableHead>
                      <TableHead className="text-right">Custo Revisão</TableHead>
                      <TableHead className="text-right">Pneus (km)</TableHead>
                      <TableHead className="text-right">Custo Pneus</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.id}</TableCell>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell className="text-right">{group.revisionKm.toLocaleString()}</TableCell>
                        <TableCell className="text-right">R$ {group.revisionCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{group.tireKm.toLocaleString()}</TableCell>
                        <TableCell className="text-right">R$ {group.tireCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditGroup(group)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader 
              title="Parâmetros de Manutenção" 
              subtitle="Configure os parâmetros gerais de manutenção"
            />
            <div className="p-6 pt-0">
              <p className="text-muted-foreground mb-4">
                Os parâmetros de manutenção são definidos por grupo de veículo na aba "Grupos de Veículos".
              </p>
              
              <div className="border rounded-md p-4 bg-muted/30">
                <h3 className="font-medium mb-2">Como funciona o cálculo de manutenção?</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  O sistema calcula o custo de manutenção com base nos parâmetros definidos para cada grupo de veículo:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Intervalo de revisão (km) - define quando uma revisão é necessária</li>
                  <li>Custo da revisão (R$) - define quanto custa cada revisão</li>
                  <li>Intervalo de troca de pneus (km) - define quando os pneus precisam ser trocados</li>
                  <li>Custo da troca de pneus (R$) - define quanto custa cada troca de pneus</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Para cada contrato, o sistema calcula quantas revisões e trocas de pneus serão necessárias 
                  com base na quilometragem mensal e duração do contrato.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Editar Grupo de Veículo' : 'Novo Grupo de Veículo'}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros do grupo de veículo para cálculos de manutenção.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revisionKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Revisão (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
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
                      <FormLabel>Custo da Revisão (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tireKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo Troca de Pneus (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
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
                      <FormLabel>Custo da Troca de Pneus (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit">
                  <Save size={16} className="mr-2" />
                  {editMode ? 'Atualizar' : 'Salvar'}
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
