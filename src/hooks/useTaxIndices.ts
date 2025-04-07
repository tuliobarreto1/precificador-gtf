
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

  // Função para calcular o custo de impostos
  const calculateTaxCost = (vehicleValue: number, contractMonths: number) => {
    const breakdown = getTaxBreakdown(vehicleValue, contractMonths);
    return breakdown.monthlyCost;
  };

  // Busca dados reais da API do Banco Central
  const fetchFromBCB = async (): Promise<{ success: boolean; data?: any }> => {
    try {
      // API para SELIC (https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json)
      const selicResponse = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json');
      const selicData = await selicResponse.json();
      const selicRate = parseFloat(selicData[0]?.valor || "0");
      
      // API para IPCA (https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json)
      const ipcaResponse = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json');
      const ipcaData = await ipcaResponse.json();
      const ipcaRate = parseFloat(ipcaData[0]?.valor || "0");
      
      // API para IGPM (https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/1?formato=json)
      const igpmResponse = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/1?formato=json');
      const igpmData = await igpmResponse.json();
      const igpmRate = parseFloat(igpmData[0]?.valor || "0");
      
      // Para diferentes prazos da SELIC, vamos aplicar um spread simulado
      // Uma API real poderia fornecer esses valores diretamente
      const selic12 = selicRate;
      const selic18 = Math.max(selicRate - 0.5, 0); // 0.5% menor para prazos maiores
      const selic24 = Math.max(selicRate - 1.0, 0); // 1.0% menor para prazos ainda maiores
      
      return {
        success: true,
        data: {
          selic: selicRate,
          ipca: ipcaRate,
          igpm: igpmRate,
          selic12,
          selic18,
          selic24,
          date: new Date()
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados do Banco Central:', error);
      return { success: false };
    }
  };

  const updateIndices = async (newIndices: TaxIndices) => {
    try {
      // Atualiza no banco de dados
      const lastTaxUpdate = newIndices.lastUpdate || new Date();
      const success = await updateCalculationParams({
        ipca_rate: newIndices.ipca,
        igpm_rate: newIndices.igpm,
        tax_spread: newIndices.spread,
        selic_month12: newIndices.selicRates.month12,
        selic_month18: newIndices.selicRates.month18,
        selic_month24: newIndices.selicRates.month24,
        last_tax_update: typeof lastTaxUpdate === 'string' ? lastTaxUpdate : lastTaxUpdate.toISOString(), // Garantindo que seja string
      });
      
      if (success) {
        // Atualiza o estado local
        setIndices({
          ...newIndices,
          lastUpdate: typeof lastTaxUpdate === 'string' ? new Date(lastTaxUpdate) : lastTaxUpdate,
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
    calculateTaxCost,
    updateIndices,
    refreshIndices,
    fetchFromBCB // Exportando a nova função
  };
}
