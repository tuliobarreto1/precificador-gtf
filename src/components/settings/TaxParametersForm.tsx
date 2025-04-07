
import React, { useState, useEffect } from 'react';
import { fetchCalculationParams, updateCalculationParams } from '@/lib/settings';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, RefreshCw, Loader2 } from 'lucide-react';

// Schema de validação para o formulário
const taxFormSchema = z.object({
  ipca_rate: z.coerce.number().min(0, 'Valor deve ser positivo'),
  igpm_rate: z.coerce.number().min(0, 'Valor deve ser positivo'),
  tax_spread: z.coerce.number().min(0, 'Valor deve ser positivo'),
  selic_month12: z.coerce.number().min(0, 'Valor deve ser positivo'),
  selic_month18: z.coerce.number().min(0, 'Valor deve ser positivo'),
  selic_month24: z.coerce.number().min(0, 'Valor deve ser positivo'),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

const TaxParametersForm = () => {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Inicializar formulário com valores padrão
  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      ipca_rate: 3.50,
      igpm_rate: 3.40,
      tax_spread: 5.30,
      selic_month12: 12.75,
      selic_month18: 11.75,
      selic_month24: 10.25,
    },
  });

  // Carregar parâmetros do banco ao inicializar
  useEffect(() => {
    const loadParams = async () => {
      setLoading(true);
      try {
        const params = await fetchCalculationParams();
        
        if (params) {
          form.reset({
            ipca_rate: params.ipca_rate || 3.50,
            igpm_rate: params.igpm_rate || 3.40,
            tax_spread: params.tax_spread || 5.30,
            selic_month12: params.selic_month12 || 12.75,
            selic_month18: params.selic_month18 || 11.75,
            selic_month24: params.selic_month24 || 10.25,
          });
          
          setLastUpdate(new Date(params.updated_at));
        }
      } catch (error) {
        console.error('Erro ao carregar parâmetros de impostos:', error);
        toast.error('Não foi possível carregar os parâmetros de impostos');
      } finally {
        setLoading(false);
      }
    };
    
    loadParams();
  }, []);

  // Atualizar índices automaticamente da API do Banco Central
  const fetchIndicesFromBCB = async () => {
    setLoading(true);
    try {
      // Para uma implementação real, substitua por uma chamada à API do Banco Central
      // Em um cenário real, a aplicação buscaria os índices usando a API do Banco Central
      
      toast.info('Iniciando atualização dos índices...');
      
      // Simulando tempo de processamento da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Valores fictícios para demonstração - em produção, estes viriam da API
      const bcbValues = {
        ipca_rate: 3.62,
        igpm_rate: 3.58,
        selic_month12: 11.50,
        selic_month18: 10.75,
        selic_month24: 9.90,
      };
      
      // Manter o spread configurado pelo usuário
      const currentSpread = form.getValues('tax_spread');
      
      // Atualizar o formulário com os novos valores
      form.reset({
        ...bcbValues,
        tax_spread: currentSpread,
      });
      
      toast.success('Índices atualizados com sucesso!');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar índices do Banco Central:', error);
      toast.error('Não foi possível atualizar os índices');
    } finally {
      setLoading(false);
    }
  };

  // Salvar as configurações
  const onSubmit = async (values: TaxFormValues) => {
    setLoading(true);
    try {
      const result = await updateCalculationParams({
        ipca_rate: values.ipca_rate,
        igpm_rate: values.igpm_rate,
        tax_spread: values.tax_spread,
        selic_month12: values.selic_month12,
        selic_month18: values.selic_month18,
        selic_month24: values.selic_month24,
      });
      
      if (result) {
        toast.success('Parâmetros de impostos salvos com sucesso');
        setLastUpdate(new Date());
      } else {
        toast.error('Erro ao salvar parâmetros de impostos');
      }
    } catch (error) {
      console.error('Erro ao salvar parâmetros de impostos:', error);
      toast.error('Ocorreu um erro ao salvar os parâmetros');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* IPCA */}
          <FormField
            control={form.control}
            name="ipca_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IPCA (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Índice Nacional de Preços ao Consumidor Amplo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* IGPM */}
          <FormField
            control={form.control}
            name="igpm_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IGPM (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Índice Geral de Preços do Mercado
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Spread */}
          <FormField
            control={form.control}
            name="tax_spread"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spread (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormDescription>
                  Percentual adicional aplicado sobre os índices
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* SELIC 12 meses */}
          <FormField
            control={form.control}
            name="selic_month12"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SELIC 12 meses (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Taxa SELIC para contratos de 12 meses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* SELIC 18 meses */}
          <FormField
            control={form.control}
            name="selic_month18"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SELIC 18 meses (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Taxa SELIC para contratos de 18 meses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* SELIC 24 meses */}
          <FormField
            control={form.control}
            name="selic_month24"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SELIC 24 meses (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Taxa SELIC para contratos de 24 meses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {lastUpdate && (
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleString()}
          </p>
        )}
        
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={fetchIndicesFromBCB}
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Atualizar Índices do BCB
          </Button>
          
          <Button type="submit" disabled={loading} className="flex items-center">
            {loading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Salvar Parâmetros
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaxParametersForm;
