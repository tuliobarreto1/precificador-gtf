
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

export function useTaxIndices() {
  const [taxRates, setTaxRates] = useState<TaxRates>({
    selicMonth12: 12.75,
    selicMonth18: 11.75,
    selicMonth24: 10.25,
    taxSpread: 5.3,
    lastUpdate: null
  });
  
  useEffect(() => {
    const fetchTaxRates = async () => {
      try {
        const { data, error } = await supabase
          .from('calculation_params')
          .select('selic_month12, selic_month18, selic_month24, tax_spread, last_tax_update')
          .single();
          
        if (error) {
          console.error("Erro ao carregar taxas financeiras:", error);
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
          console.log("Taxas financeiras carregadas:", data);
        }
      } catch (error) {
        console.error("Erro ao buscar taxas financeiras:", error);
      }
    };
    
    fetchTaxRates();
  }, []);
  
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
    getTaxBreakdown
  };
}
