
import React, { useState, useEffect } from 'react';
import { useTaxIndices } from '@/hooks/useTaxIndices';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui-custom/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, RefreshCw, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema de validação para o formulário
const taxFormSchema = z.object({
  ipca: z.coerce.number().min(0, { message: 'Valor deve ser positivo' }),
  igpm: z.coerce.number().min(0, { message: 'Valor deve ser positivo' }),
  spread: z.coerce.number().min(0, { message: 'Valor deve ser positivo' }),
  selic_month12: z.coerce.number().min(0, { message: 'Valor deve ser positivo' }),
  selic_month18: z.coerce.number().min(0, { message: 'Valor deve ser positivo' }),
  selic_month24: z.coerce.number().min(0, { message: 'Valor deve ser positivo' }),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

const TaxParametersForm = () => {
  const { indices, loading, error, updateIndices, refreshIndices } = useTaxIndices();
  const [updatingBCB, setUpdatingBCB] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inicializar formulário com valores do hook
  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      ipca: indices.ipca,
      igpm: indices.igpm,
      spread: indices.spread,
      selic_month12: indices.selicRates.month12,
      selic_month18: indices.selicRates.month18,
      selic_month24: indices.selicRates.month24,
    },
  });

  // Atualizar formulário quando os índices mudarem
  useEffect(() => {
    if (!loading) {
      form.reset({
        ipca: indices.ipca,
        igpm: indices.igpm,
        spread: indices.spread,
        selic_month12: indices.selicRates.month12,
        selic_month18: indices.selicRates.month18,
        selic_month24: indices.selicRates.month24,
      });
    }
  }, [loading, indices, form]);

  // Atualizar índices automaticamente da API do Banco Central
  const fetchIndicesFromBCB = async () => {
    try {
      setUpdatingBCB(true);
      
      // Em um cenário real, esta função faria uma chamada para uma API
      // que busca as taxas atualizadas do Banco Central do Brasil
      toast.info('Iniciando busca de índices atualizados do Banco Central...');
      
      // Simulando uma chamada à API do Banco Central (em produção, usaria fetch real para a API)
      // Para demonstração, usamos valores simulados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Valores de exemplo - em produção, viriam da API real
      const bcbValues = {
        ipca: 3.62,
        igpm: 3.58,
        selicRates: {
          month12: 11.50,
          month18: 10.75,
          month24: 9.90
        }
      };
      
      // Manter o spread configurado pelo usuário
      const currentSpread = form.getValues('spread');
      
      // Atualizar os índices no banco de dados
      const success = await updateIndices({
        ipca: bcbValues.ipca,
        igpm: bcbValues.igpm,
        selicRates: bcbValues.selicRates,
        spread: currentSpread
      });
      
      if (success) {
        toast.success('Índices atualizados com dados do Banco Central!');
        
        // Atualizar o formulário com os novos valores
        form.reset({
          ipca: bcbValues.ipca,
          igpm: bcbValues.igpm,
          spread: currentSpread,
          selic_month12: bcbValues.selicRates.month12,
          selic_month18: bcbValues.selicRates.month18,
          selic_month24: bcbValues.selicRates.month24,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar índices do BCB:', err);
      toast.error('Não foi possível atualizar os índices do Banco Central');
    } finally {
      setUpdatingBCB(false);
    }
  };

  // Salvar as configurações
  const onSubmit = async (values: TaxFormValues) => {
    setSaving(true);
    try {
      const success = await updateIndices({
        ipca: values.ipca,
        igpm: values.igpm,
        spread: values.spread,
        selicRates: {
          month12: values.selic_month12,
          month18: values.selic_month18,
          month24: values.selic_month24
        }
      });
      
      if (success) {
        toast.success('Índices financeiros salvos com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar índices:', error);
      toast.error('Ocorreu um erro ao salvar os índices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Fonte dos índices</AlertTitle>
        <AlertDescription>
          Os índices IPCA, IGPM e SELIC podem ser atualizados automaticamente a partir do Banco Central do Brasil, 
          ou inseridos manualmente. O Spread é um valor personalizado definido pela empresa.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* IPCA */}
            <FormField
              control={form.control}
              name="ipca"
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
              name="igpm"
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
              name="spread"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spread (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Percentual adicional aplicado sobre a taxa SELIC
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
          
          {indices.lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Última atualização: {indices.lastUpdate.toLocaleString()}
            </p>
          )}
          
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={fetchIndicesFromBCB}
              disabled={updatingBCB || saving}
              className="flex items-center"
            >
              {updatingBCB ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Atualizar do Banco Central
            </Button>
            
            <Button 
              type="submit" 
              disabled={updatingBCB || saving} 
              className="flex items-center"
            >
              {saving ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>

      <Card className="mt-6 p-4">
        <h3 className="text-lg font-medium mb-2">Explicação do cálculo</h3>
        <p className="text-sm text-muted-foreground">
          O custo financeiro é calculado com base nas taxas SELIC conforme o prazo do contrato:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
          <li>Contratos até 12 meses: SELIC 12 meses ({indices.selicRates.month12}%) + Spread ({indices.spread}%)</li>
          <li>Contratos de 13 a 18 meses: SELIC 18 meses ({indices.selicRates.month18}%) + Spread ({indices.spread}%)</li>
          <li>Contratos acima de 18 meses: SELIC 24 meses ({indices.selicRates.month24}%) + Spread ({indices.spread}%)</li>
        </ul>
        <p className="text-sm mt-3">
          <strong>Fórmula:</strong> Custo mensal = (Valor do veículo × (SELIC + Spread)) ÷ 12
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Obs: Os índices IPCA e IGPM são armazenados para referência, mas atualmente não são utilizados nos cálculos.
        </p>
      </Card>
    </div>
  );
};

export default TaxParametersForm;
