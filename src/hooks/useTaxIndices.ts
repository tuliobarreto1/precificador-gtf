
import { useState, useEffect } from 'react';
import { fetchCalculationParams } from '@/lib/settings';

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
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar as taxas SELIC atualizadas
  const fetchSelicRates = async () => {
    try {
      // Para uma implementação real, substitua esta URL pela API do Banco Central
      // Exemplo: https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/100?formato=json
      const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/30?formato=json');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados da SELIC');
      }
      
      const data = await response.json();
      
      // Em uma implementação real, este processamento dependeria da estrutura de dados da API
      // Para fins de exemplo, estamos apenas usando valores fixos
      // No mundo real, você interpretaria os dados retornados pela API
      
      // Buscar também parâmetros personalizados do sistema
      const params = await fetchCalculationParams();
      
      // Atualizar os índices com os valores da API e do banco de dados
      setIndices({
        ipca: params?.ipca_rate || 3.50,
        igpm: params?.igpm_rate || 3.40,
        spread: params?.tax_spread || 5.3,
        selicRates: {
          month12: 12.75, // Em produção, substituir por valores reais da API
          month18: 11.75,
          month24: 10.25
        }
      });
      
      console.log('✅ Índices de impostos atualizados:', indices);
      
    } catch (err) {
      console.error('❌ Erro ao buscar taxas SELIC:', err);
      setError('Não foi possível carregar os índices atualizados');
      
      // Em caso de erro, manter os valores padrão
    } finally {
      setLoading(false);
    }
  };

  // Buscar índices ao inicializar o hook
  useEffect(() => {
    setLoading(true);
    fetchSelicRates();
  }, []);

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

  // Atualizar os índices manualmente (para uso em formulários de configuração)
  const updateIndices = (newIndices: Partial<TaxIndices>) => {
    setIndices(prev => ({
      ...prev,
      ...newIndices
    }));
  };

  return {
    indices,
    loading,
    error,
    calculateTaxCost,
    updateIndices,
    refreshIndices: fetchSelicRates
  };
}
