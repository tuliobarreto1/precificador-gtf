
import { useState, useEffect } from 'react';
import { fetchCalculationParams, updateCalculationParams } from '@/lib/settings';
import { toast } from 'sonner';

// Estrutura de dados para os índices de impostos
export interface TaxIndices {
  ipca: number;      // Índice Nacional de Preços ao Consumidor Amplo
  igpm: number;      // Índice Geral de Preços do Mercado
  spread: number;    // Spread financeiro
  selicRates: {      // Taxas SELIC para diferentes prazos
    month12: number;
    month18: number;
    month24: number;
  }
  lastUpdate: Date | null; // Data da última atualização
}

// Hook para buscar e gerenciar os índices de impostos
export function useTaxIndices() {
  const [indices, setIndices] = useState<TaxIndices>({
    ipca: 3.50,      // Valor padrão do IPCA
    igpm: 3.40,      // Valor padrão do IGPM
    spread: 5.3,     // Valor padrão do spread
    selicRates: {
      month12: 12.75, // Valores padrão da SELIC
      month18: 11.75,
      month24: 10.25
    },
    lastUpdate: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar as taxas do banco de dados
  const fetchIndices = async () => {
    try {
      setLoading(true);
      // Buscar parâmetros personalizados do sistema de banco de dados
      const params = await fetchCalculationParams();
      
      if (params) {
        setIndices({
          ipca: params.ipca_rate || 3.50,
          igpm: params.igpm_rate || 3.40,
          spread: params.tax_spread || 5.3,
          selicRates: {
            month12: params.selic_month12 || 12.75,
            month18: params.selic_month18 || 11.75,
            month24: params.selic_month24 || 10.25
          },
          lastUpdate: params.last_tax_update ? new Date(params.last_tax_update) : new Date()
        });
        
        console.log('✅ Índices de impostos atualizados do banco:', {
          ipca: params.ipca_rate,
          igpm: params.igpm_rate,
          spread: params.tax_spread,
          selic12: params.selic_month12,
          selic18: params.selic_month18,
          selic24: params.selic_month24,
          lastUpdate: params.last_tax_update
        });
      }
      
    } catch (err) {
      console.error('❌ Erro ao buscar taxas do banco:', err);
      setError('Não foi possível carregar os índices atualizados');
      
      // Em caso de erro, manter os valores padrão
    } finally {
      setLoading(false);
    }
  };

  // Buscar índices ao inicializar o hook
  useEffect(() => {
    fetchIndices();
  }, []);

  // Atualizar índices no banco de dados
  const saveIndices = async (newIndices: Partial<TaxIndices>): Promise<boolean> => {
    setLoading(true);
    try {
      // Converter formato interno para formato da tabela
      const paramsToUpdate: any = {};
      
      if (newIndices.ipca !== undefined) paramsToUpdate.ipca_rate = newIndices.ipca;
      if (newIndices.igpm !== undefined) paramsToUpdate.igpm_rate = newIndices.igpm;
      if (newIndices.spread !== undefined) paramsToUpdate.tax_spread = newIndices.spread;
      if (newIndices.selicRates?.month12 !== undefined) paramsToUpdate.selic_month12 = newIndices.selicRates.month12;
      if (newIndices.selicRates?.month18 !== undefined) paramsToUpdate.selic_month18 = newIndices.selicRates.month18;
      if (newIndices.selicRates?.month24 !== undefined) paramsToUpdate.selic_month24 = newIndices.selicRates.month24;
      
      // Sempre atualizar a data da última atualização
      paramsToUpdate.last_tax_update = new Date().toISOString();
      
      const success = await updateCalculationParams(paramsToUpdate);
      
      if (success) {
        // Atualizar o estado local com os novos valores
        setIndices(prev => ({
          ...prev,
          ...newIndices,
          lastUpdate: new Date()
        }));
        
        toast.success('Índices atualizados com sucesso');
        return true;
      } else {
        toast.error('Falha ao atualizar índices no banco de dados');
        return false;
      }
    } catch (err) {
      console.error('Erro ao salvar índices:', err);
      toast.error('Ocorreu um erro ao atualizar os índices');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Calcular custo de impostos com base nos parâmetros e prazos
  const calculateTaxCost = (vehicleValue: number, contractMonths: number): number => {
    let selicRate = indices.selicRates.month12; // Padrão para 12 meses
    
    // Selecionar a taxa SELIC com base no prazo contratual
    if (contractMonths >= 24) {
      selicRate = indices.selicRates.month24;
    } else if (contractMonths >= 18) {
      selicRate = indices.selicRates.month18;
    }
    
    // Fórmula base para cálculo dos impostos
    // Custo = (SELIC + SPREAD) / 12 (para obter o valor mensal)
    const taxRate = (selicRate + indices.spread) / 100;
    const monthlyCost = (vehicleValue * taxRate) / 12;
    
    console.log(`📊 Cálculo de impostos: Valor do veículo: R$ ${vehicleValue.toFixed(2)}, Prazo: ${contractMonths} meses, Taxa SELIC: ${selicRate}%, Spread: ${indices.spread}%, Taxa total anual: ${taxRate * 100}%, Custo mensal: R$ ${monthlyCost.toFixed(2)}`);
    
    return monthlyCost;
  };

  // Obter o detalhamento para mostrar na UI
  const getTaxBreakdown = (vehicleValue: number, contractMonths: number) => {
    let selicRate = indices.selicRates.month12;
    
    if (contractMonths >= 24) {
      selicRate = indices.selicRates.month24;
    } else if (contractMonths >= 18) {
      selicRate = indices.selicRates.month18;
    }
    
    const taxRate = (selicRate + indices.spread) / 100;
    const annualCost = vehicleValue * taxRate;
    const monthlyCost = annualCost / 12;
    
    return {
      selicRate,
      spread: indices.spread,
      totalTaxRate: taxRate * 100, // Em percentual
      annualCost,
      monthlyCost
    };
  };

  return {
    indices,
    loading,
    error,
    calculateTaxCost,
    getTaxBreakdown,
    updateIndices: saveIndices,
    refreshIndices: fetchIndices
  };
}
