import { useState, useEffect, useCallback } from 'react';
import { fetchCalculationParams, updateCalculationParams, CalculationParams } from '@/lib/settings';

export interface TaxIndices {
  ipca: number;
  igpm: number;
  spread: number;
  selicRates: {
    month12: number;
    month18: number;
    month24: number;
  };
  lastUpdate: Date;
}

export function useTaxIndices() {
  const [indices, setIndices] = useState<TaxIndices>({
    ipca: 0,
    igpm: 0,
    spread: 0,
    selicRates: {
      month12: 0,
      month18: 0,
      month24: 0,
    },
    lastUpdate: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIndices = useCallback(async () => {
    setLoading(true);
    try {
      const params = await fetchCalculationParams();
      
      if (params) {
        setIndices({
          ipca: params.ipca_rate || 3.5,
          igpm: params.igpm_rate || 3.4,
          spread: params.tax_spread || 5.5,
          selicRates: {
            month12: params.selic_month12 || 12.75,
            month18: params.selic_month18 || 11.75,
            month24: params.selic_month24 || 10.25,
          },
          lastUpdate: params.last_tax_update ? new Date(params.last_tax_update) : new Date(),
        });
      }
    } catch (error) {
      console.error('Erro ao buscar índices:', error);
      setError('Não foi possível carregar os índices financeiros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIndices();
  }, [refreshIndices]);

  const getTaxBreakdown = (vehicleValue: number, contractMonths: number) => {
    const selicRate = contractMonths >= 24 ? indices.selicRates.month24 : contractMonths >= 18 ? indices.selicRates.month18 : indices.selicRates.month12;
    const totalTaxRate = selicRate + indices.spread;
    const annualCost = vehicleValue * (totalTaxRate / 100);
    const monthlyCost = annualCost / 12;

    return {
      selicRate,
      spread: indices.spread,
      totalTaxRate,
      annualCost,
      monthlyCost,
    };
  };

  const updateIndices = async (newIndices: TaxIndices) => {
    try {
      // Atualiza no banco de dados
      const lastTaxUpdate = new Date();
      const success = await updateCalculationParams({
        ipca_rate: newIndices.ipca,
        igpm_rate: newIndices.igpm,
        tax_spread: newIndices.spread,
        selic_month12: newIndices.selicRates.month12,
        selic_month18: newIndices.selicRates.month18,
        selic_month24: newIndices.selicRates.month24,
        last_tax_update: lastTaxUpdate.toISOString(), // Convertendo para string
      });
      
      if (success) {
        // Atualiza o estado local
        setIndices({
          ...newIndices,
          lastUpdate: lastTaxUpdate,
        });
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao atualizar índices:', error);
      return false;
    }
  };

  return {
    indices,
    loading,
    error,
    getTaxBreakdown,
    updateIndices,
    refreshIndices
  };
}
