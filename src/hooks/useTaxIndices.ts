import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaxRates {
  selicMonth12: number;
  selicMonth18: number;
  selicMonth24: number;
  taxSpread: number;
  lastUpdate: Date | null;
}

interface TaxBreakdown {
  selicRate: number;
  spread: number;
  totalTaxRate: number;
  annualCost: number;
  monthlyCost: number;
}

interface Indices {
  ipca: number;
  igpm: number;
  spread: number;
  selicRates: {
    month12: number;
    month18: number;
    month24: number;
  };
  lastUpdate: Date | null;
}

interface BCBData {
  ipca: number;
  igpm: number;
  selic12: number;
  selic18: number;
  selic24: number;
  date: Date;
}

export function useTaxIndices() {
  const [taxRates, setTaxRates] = useState<TaxRates>({
    selicMonth12: 12.75,
    selicMonth18: 11.75,
    selicMonth24: 10.25,
    taxSpread: 5.3,
    lastUpdate: null
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [indices, setIndices] = useState<Indices>({
    ipca: 3.5,
    igpm: 3.4,
    spread: 5.3,
    selicRates: {
      month12: 12.75,
      month18: 11.75,
      month24: 10.25
    },
    lastUpdate: null
  });
  
  useEffect(() => {
    fetchTaxRates();
  }, []);
  
  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('calculation_params')
        .select('selic_month12, selic_month18, selic_month24, tax_spread, last_tax_update, ipca_rate, igpm_rate')
        .single();
          
      if (error) {
        console.error("Erro ao carregar taxas financeiras:", error);
        setError("Erro ao carregar taxas financeiras");
        return;
      }
      
      if (data) {
        setTaxRates({
          selicMonth12: data.selic_month12 || 12.75,
          selicMonth18: data.selic_month18 || 11.75,
          selicMonth24: data.selic_month24 || 10.25,
          taxSpread: data.tax_spread || 5.3,
          lastUpdate: data.last_tax_update ? new Date(data.last_tax_update) : null
        });
        
        setIndices({
          ipca: data.ipca_rate || 3.5,
          igpm: data.igpm_rate || 3.4,
          spread: data.tax_spread || 5.3,
          selicRates: {
            month12: data.selic_month12 || 12.75,
            month18: data.selic_month18 || 11.75,
            month24: data.selic_month24 || 10.25
          },
          lastUpdate: data.last_tax_update ? new Date(data.last_tax_update) : null
        });
        
        console.log("Taxas financeiras carregadas:", data);
      }
    } catch (error) {
      console.error("Erro ao buscar taxas financeiras:", error);
      setError("Erro ao buscar taxas financeiras");
    } finally {
      setLoading(false);
    }
  };
  
  // Função para atualizar índices
  const updateIndices = async (newIndices: Partial<Indices>): Promise<boolean> => {
    try {
      setLoading(true);
      
      const updateData: Record<string, any> = {};
      
      if (newIndices.ipca !== undefined) updateData.ipca_rate = newIndices.ipca;
      if (newIndices.igpm !== undefined) updateData.igpm_rate = newIndices.igpm;
      if (newIndices.spread !== undefined) updateData.tax_spread = newIndices.spread;
      
      if (newIndices.selicRates) {
        if (newIndices.selicRates.month12 !== undefined) 
          updateData.selic_month12 = newIndices.selicRates.month12;
        if (newIndices.selicRates.month18 !== undefined) 
          updateData.selic_month18 = newIndices.selicRates.month18;
        if (newIndices.selicRates.month24 !== undefined) 
          updateData.selic_month24 = newIndices.selicRates.month24;
      }
      
      if (newIndices.lastUpdate) 
        updateData.last_tax_update = newIndices.lastUpdate.toISOString();
      
      const { error } = await supabase
        .from('calculation_params')
        .update(updateData)
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .select();
      
      if (error) {
        console.error("Erro ao atualizar índices:", error);
        setError("Erro ao atualizar índices");
        return false;
      }
      
      // Atualizar valores locais
      setIndices(prev => ({
        ...prev,
        ...newIndices,
      }));
      
      // Atualizar também taxRates para manter compatibilidade
      if (newIndices.spread !== undefined || newIndices.selicRates) {
        setTaxRates(prev => ({
          ...prev,
          taxSpread: newIndices.spread !== undefined ? newIndices.spread : prev.taxSpread,
          selicMonth12: newIndices.selicRates?.month12 !== undefined ? newIndices.selicRates.month12 : prev.selicMonth12,
          selicMonth18: newIndices.selicRates?.month18 !== undefined ? newIndices.selicRates.month18 : prev.selicMonth18,
          selicMonth24: newIndices.selicRates?.month24 !== undefined ? newIndices.selicRates.month24 : prev.selicMonth24,
          lastUpdate: newIndices.lastUpdate || prev.lastUpdate
        }));
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar índices:", error);
      setError("Erro ao atualizar índices");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Função para buscar dados do BCB (simulada)
  const fetchFromBCB = async (): Promise<{ success: boolean, data?: BCBData }> => {
    try {
      // Simulando uma chamada à API do Banco Central
      // Em uma implementação real, isso seria uma chamada de API
      const mockResponse: BCBData = {
        ipca: 4.25,
        igpm: 3.95,
        selic12: 11.75,
        selic18: 10.75,
        selic24: 9.75,
        date: new Date()
      };
      
      return { success: true, data: mockResponse };
    } catch (error) {
      console.error("Erro ao buscar dados do BCB:", error);
      return { success: false };
    }
  };
  
  // Função para recarregar índices
  const refreshIndices = async (): Promise<boolean> => {
    return fetchTaxRates().then(() => true).catch(() => false);
  };
  
  // Calcular a taxa SELIC apropriada com base no prazo
  const getSelicRate = (contractMonths: number): number => {
    if (contractMonths >= 24) {
      return taxRates.selicMonth24;
    } else if (contractMonths >= 18) {
      return taxRates.selicMonth18;
    } else {
      return taxRates.selicMonth12;
    }
  };
  
  // Calcular o custo financeiro para um valor específico
  const calculateTaxCost = (vehicleValue: number, contractMonths: number): number => {
    const breakdown = getTaxBreakdown(vehicleValue, contractMonths);
    return breakdown.monthlyCost;
  };
  
  // Obter detalhamento completo do cálculo de impostos
  const getTaxBreakdown = (vehicleValue: number, contractMonths: number): TaxBreakdown => {
    const selicRate = getSelicRate(contractMonths);
    const spread = taxRates.taxSpread;
    const totalTaxRate = selicRate + spread;
    
    // Calcular custo anual
    const annualCost = (vehicleValue * totalTaxRate) / 100;
    
    // Calcular custo mensal
    const monthlyCost = annualCost / 12;
    
    return {
      selicRate,
      spread,
      totalTaxRate,
      annualCost,
      monthlyCost
    };
  };
  
  return {
    taxRates,
    getSelicRate,
    calculateTaxCost,
    getTaxBreakdown,
    indices,
    loading,
    error,
    updateIndices,
    refreshIndices,
    fetchFromBCB
  };
}