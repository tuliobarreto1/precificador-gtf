import React, { useState, useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fetchCalculationParams, updateCalculationParams, CalculationParams } from '@/lib/settings';

const depreciationParamsSchema = z.object({
  base_rate: z.number().min(0.01, { message: 'Taxa base deve ser maior que 0.01' }).max(1, { message: 'Taxa base deve ser menor que 1' }),
  severity_multiplier_1: z.number().min(0, { message: 'Multiplicador deve ser positivo' }),
  severity_multiplier_2: z.number().min(0, { message: 'Multiplicador deve ser positivo' }),
  severity_multiplier_3: z.number().min(0, { message: 'Multiplicador deve ser positivo' }),
  severity_multiplier_4: z.number().min(0, { message: 'Multiplicador deve ser positivo' }),
  severity_multiplier_5: z.number().min(0, { message: 'Multiplicador deve ser positivo' }),
  severity_multiplier_6: z.number().min(0, { message: 'Multiplicador deve ser positivo' }),
});

type DepreciationParamsFormValues = z.infer<typeof depreciationParamsSchema>;

const DepreciationParametersForm = () => {
  const [loadingParams, setLoadingParams] = useState(false);
  const [savingParams, setSavingParams] = useState(false);
  const [calculationParamsId, setCalculationParamsId] = useState<string | undefined>();

  const form = useForm<DepreciationParamsFormValues>({
    resolver: zodResolver(depreciationParamsSchema),
    defaultValues: {
      base_rate: 0.35,
      severity_multiplier_1: 0.05,
      severity_multiplier_2: 0.06,
      severity_multiplier_3: 0.08,
      severity_multiplier_4: 0.10,
      severity_multiplier_5: 0.12,
      severity_multiplier_6: 0.20,
    },
  });

  useEffect(() => {
    loadCalculationParams();
  }, []);

  const loadCalculationParams = async () => {
    setLoadingParams(true);
    try {
      const params = await fetchCalculationParams();
      
      if (params) {
        setCalculationParamsId(params.id);
        
        // Converter parâmetros do banco para o formato do formulário
        form.reset({
          base_rate: params.depreciation_base_rate || 0.35,
          severity_multiplier_1: params.severity_multiplier_1 || 0.05,
          severity_multiplier_2: params.severity_multiplier_2 || 0.06,
          severity_multiplier_3: params.severity_multiplier_3 || 0.08,
          severity_multiplier_4: params.severity_multiplier_4 || 0.10,
          severity_multiplier_5: params.severity_multiplier_5 || 0.12,
          severity_multiplier_6: params.severity_multiplier_6 || 0.20,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros de depreciação:', error);
      toast.error('Não foi possível carregar os parâmetros de depreciação');
    } finally {
      setLoadingParams(false);
    }
  };

  const onSubmit = async (values: DepreciationParamsFormValues) => {
    setSavingParams(true);
    try {
      // Buscar parâmetros existentes para preservar outros valores
      const existingParams = await fetchCalculationParams();
      
      // Combinar valores existentes com os novos
      const updatedParams: Partial<CalculationParams> = {
        tracking_cost: existingParams?.tracking_cost || 50,
        depreciation_base: existingParams?.depreciation_base || 0.015,
        depreciation_mileage_multiplier: existingParams?.depreciation_mileage_multiplier || 0.05,
        depreciation_severity_multiplier: existingParams?.depreciation_severity_multiplier || 0.1,
        extra_km_percentage: existingParams?.extra_km_percentage || 0.0000075,
        // Adicionar novos campos para a fórmula de depreciação
        depreciation_base_rate: values.base_rate,
        severity_multiplier_1: values.severity_multiplier_1,
        severity_multiplier_2: values.severity_multiplier_2,
        severity_multiplier_3: values.severity_multiplier_3,
        severity_multiplier_4: values.severity_multiplier_4,
        severity_multiplier_5: values.severity_multiplier_5,
        severity_multiplier_6: values.severity_multiplier_6,
      };
      
      const success = await updateCalculationParams(updatedParams);
      
      if (success) {
        toast.success('Parâmetros de depreciação atualizados com sucesso');
      } else {
        toast.error('Erro ao atualizar parâmetros de depreciação');
      }
    } catch (error) {
      console.error('Erro ao salvar parâmetros de depreciação:', error);
      toast.error('Ocorreu um erro ao salvar os parâmetros de depreciação');
    } finally {
      setSavingParams(false);
    }
  };

  return (
    <div className="p-4">
      {loadingParams ? (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Carregando parâmetros de depreciação...</span>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="base_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa Base de Depreciação</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        max="1" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))} 
                      />
                    </FormControl>
                    <FormDescription>
                      Base para cálculo da depreciação (ex: 0.35 = 35%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Multiplicadores por Severidade</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="severity_multiplier_1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade 1</FormLabel>
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
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity_multiplier_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade 2</FormLabel>
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
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity_multiplier_3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade 3</FormLabel>
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
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity_multiplier_4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade 4</FormLabel>
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
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity_multiplier_5"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade 5</FormLabel>
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
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity_multiplier_6"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade 6</FormLabel>
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
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => loadCalculationParams()} 
                className="mr-2"
                disabled={savingParams}
              >
                <RefreshCw size={16} className="mr-2" />
                Restaurar
              </Button>
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
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar Parâmetros
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default DepreciationParametersForm;
