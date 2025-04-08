import { useState, useEffect, useCallback } from 'react';
import { QuoteFormData, SavedQuote, QuoteCalculationResult, User, EditRecord } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { getClientById, getVehicleById } from '@/lib/data-provider';
import { Client, Vehicle } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

const SAVED_QUOTES_KEY = 'savedQuotes';

export function useQuoteSaving(
  quoteForm: QuoteFormData, 
  calculateQuote: () => QuoteCalculationResult | null | Promise<QuoteCalculationResult | null>, 
  getCurrentUser: () => User
) {
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditingQuoteId, setCurrentEditingQuoteId] = useState<string | null>(null);
  const [loadingSavedQuotes, setLoadingSavedQuotes] = useState(false);

  useEffect(() => {
    try {
      const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
      if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes);
        setSavedQuotes(parsedQuotes);
        console.log('Cotações carregadas do localStorage:', parsedQuotes);
      }
    } catch (error) {
      console.error('Erro ao carregar cotações salvas:', error);
    }
  }, []);

  // Salvar um orçamento
  const saveQuote = async () => {
    try {
      if (!quoteForm.client || quoteForm.vehicles.length === 0) {
        console.error("Dados insuficientes para salvar orçamento: cliente ou veículos ausentes");
        return false;
      }
      
      console.log("🔄 Iniciando salvamento de orçamento:", {
        cliente: quoteForm.client.name,
        veículos: quoteForm.vehicles.length
      });
      
      const calculationResult = await calculateQuote();
      if (!calculationResult) {
        console.error("Erro no cálculo do orçamento antes de salvar");
        return false;
      }
      
      const { vehicleResults, totalCost } = calculationResult;
      
      // Preparar dados do orçamento com campos de impostos
      const quoteData: any = {
        id: isEditMode && currentEditingQuoteId ? currentEditingQuoteId : uuidv4(),
        client_id: quoteForm.client.id,
        contract_months: quoteForm.globalParams.contractMonths,
        monthly_km: quoteForm.globalParams.monthlyKm,
        operation_severity: quoteForm.globalParams.operationSeverity,
        has_tracking: quoteForm.globalParams.hasTracking,
        include_ipva: quoteForm.globalParams.includeIpva,
        include_licensing: quoteForm.globalParams.includeLicensing,
        include_taxes: quoteForm.globalParams.includeTaxes,
        global_protection_plan_id: quoteForm.globalParams.protectionPlanId,
        total_value: totalCost,
        title: `Orçamento para ${quoteForm.client.name} - ${quoteForm.vehicles.length} veículo(s)`,
        monthly_values: totalCost,
        status: 'ORCAMENTO',
        status_flow: 'ORCAMENTO'
      };
      
      console.log("📊 Dados completos do orçamento a serem enviados:", quoteData);
      
      // Utilizar o serviço de salvamento de orçamentos diretamente
      try {
        const { success, quote, error } = await import('@/integrations/supabase/services/quotes')
          .then(module => module.saveQuoteToSupabase(quoteData));
        
        if (!success || error) {
          console.error('❌ Erro ao salvar orçamento via serviço:', error);
          return false;
        }
        
        console.log('✅ Orçamento salvo com sucesso via serviço:', quote);
        
        // Atualizar lista de orçamentos salvos
        await loadSavedQuotes();
        
        if (isEditMode) {
          setIsEditMode(false);
          setCurrentEditingQuoteId(null);
        }
        
        return true;
      } catch (serviceError) {
        console.error('❌ Erro ao usar serviço de salvamento:', serviceError);
        
        // Tentar método alternativo se o serviço falhar
        return await fallbackSaveQuote(quoteData, vehicleResults);
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar orçamento:', error);
      return false;
    }
  };

  // Método alternativo de salvamento como fallback
  const fallbackSaveQuote = async (quoteData: any, vehicleResults: any[]) => {
    try {
      console.log("⚡ Tentando método alternativo de salvamento");
      
      const { data: savedQuote, error: quoteError } = await supabase
        .from('quotes')
        .upsert({
          id: quoteData.id,
          title: quoteData.title,
          client_id: quoteData.client_id,
          contract_months: quoteData.contract_months,
          monthly_km: quoteData.monthly_km,
          operation_severity: quoteData.operation_severity,
          has_tracking: quoteData.has_tracking,
          include_ipva: quoteData.include_ipva,
          include_licensing: quoteData.include_licensing,
          include_taxes: quoteData.include_taxes,
          total_value: quoteData.total_value,
          monthly_values: quoteData.monthly_values,
          status: quoteData.status,
          status_flow: quoteData.status_flow
        })
        .select();
        
      if (quoteError) {
        console.error('❌ Erro no método alternativo:', quoteError);
        return false;
      }
      
      console.log('✅ Orçamento base salvo via método alternativo:', savedQuote);
      
      // Adicionar veículos ao orçamento
      for (let i = 0; i < quoteForm.vehicles.length; i++) {
        const vehicleItem = quoteForm.vehicles[i];
        const vehicleResult = vehicleResults.find(r => r.vehicleId === vehicleItem.vehicle.id);
        
        if (!vehicleResult) {
          console.error(`⚠️ Resultado não encontrado para veículo ${vehicleItem.vehicle.id}`);
          continue;
        }
        
        const params = quoteForm.useGlobalParams 
          ? quoteForm.globalParams 
          : (vehicleItem.params || quoteForm.globalParams);
        
        // Verificar se o ID do veículo precisa ser criado
        let vehicleId = vehicleItem.vehicle.id;
        if (vehicleId.startsWith('new-')) {
          // Criar um novo veículo
          const { data: newVehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
              id: uuidv4(),
              brand: vehicleItem.vehicle.brand || 'Não especificado',
              model: vehicleItem.vehicle.model || 'Não especificado',
              year: vehicleItem.vehicle.year || new Date().getFullYear(),
              value: vehicleItem.vehicle.value || 0,
              plate_number: vehicleItem.vehicle.plateNumber,
              is_used: false,
              group_id: vehicleItem.vehicleGroup?.id || 'A'
            })
            .select();
            
          if (vehicleError) {
            console.error('❌ Erro ao criar veículo:', vehicleError);
            continue;
          }
          
          vehicleId = newVehicle[0].id;
          console.log('✅ Novo veículo criado com sucesso:', newVehicle);
        }
          
        // Adicionar veículo ao orçamento com dados de impostos
        const { error: vehicleError } = await supabase
          .from('quote_vehicles')
          .insert({
            quote_id: quoteData.id,
            vehicle_id: vehicleId,
            contract_months: params.contractMonths,
            monthly_km: params.monthlyKm,
            operation_severity: params.operation_severity,
            has_tracking: params.hasTracking,
            include_ipva: params.includeIpva,
            include_licensing: params.includeLicensing,
            include_taxes: params.includeTaxes,
            protection_plan_id: params.protectionPlanId,
            protection_cost: vehicleResult.protectionCost || 0,
            depreciation_cost: vehicleResult.depreciationCost,
            maintenance_cost: vehicleResult.maintenanceCost,
            extra_km_rate: vehicleResult.extraKmRate,
            ipva_cost: vehicleResult.ipvaCost || 0,
            licensing_cost: vehicleResult.licensingCost || 0,
            tax_cost: vehicleResult.taxCost || 0,
            total_cost: vehicleResult.totalCost,
            monthly_value: vehicleResult.totalCost
          });
          
        if (vehicleError) {
          console.error(`❌ Erro ao salvar veículo ${vehicleId}:`, vehicleError);
        } else {
          console.log(`✅ Veículo ${i+1} salvo com sucesso com impostos: IPVA=${vehicleResult.ipvaCost}, Licenciamento=${vehicleResult.licensingCost}, Impostos=${vehicleResult.taxCost}`);
        }
      }
      
      // Atualizar lista de orçamentos salvos
      await loadSavedQuotes();
      
      if (isEditMode) {
        setIsEditMode(false);
        setCurrentEditingQuoteId(null);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro no método alternativo de salvamento:', error);
      return false;
    }
  };

  const updateQuote = (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string): boolean => {
    const quoteToUpdate = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToUpdate) return false;
    
    const editRecord: EditRecord = {
      id: uuidv4(),
      type: 'quote',
      data: {
        quoteId: quoteId,
        clientName: quoteForm.client?.name,
        vehicleCount: quoteForm.vehicles.length,
        totalValue: 0 // Valor será atualizado após o cálculo
      }
    };

    return true;
  };

  const deleteQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    console.log("🗑️ Tentando excluir orçamento:", quoteId);
    
    const quoteToDelete = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToDelete) {
      console.error('❌ Orçamento não encontrado:', quoteId);
      return false;
    }
    
    try {
      // Verificar origem do orçamento para determinar como excluir
      const quoteSource = quoteToDelete.source || 'local';
      
      if (quoteSource === 'supabase') {
        console.log("🔄 Excluindo orçamento do Supabase...");
        
        const userInfo = getCurrentUser();
        try {
          import('@/integrations/supabase/services/quoteActionLogs').then(async ({ createQuoteActionLog }) => {
            await createQuoteActionLog({
              quote_id: quoteId,
              quote_title: quoteToDelete.clientName,
              action_type: 'DELETE',
              user_id: typeof userInfo === 'string' ? userInfo : userInfo.id.toString(),
              user_name: typeof userInfo === 'string' ? userInfo : userInfo.name,
              details: {
                status: quoteToDelete.status,
                value: quoteToDelete.totalValue || 0
              },
              deleted_data: quoteToDelete
            });
            console.log('✅ Log de exclusão registrado com sucesso');
          }).catch(logError => {
            console.error('❌ Erro ao registrar log de exclusão:', logError);
          });
        } catch (logError) {
          console.error('❌ Erro ao registrar log de exclusão:', logError);
        }
        
        // Primeiro excluir os veículos relacionados
        try {
          const { error: vehiclesError } = await supabase
            .from('quote_vehicles')
            .delete()
            .eq('quote_id', quoteId);
            
          if (vehiclesError) {
            console.error('❌ Erro ao excluir veículos do orçamento:', vehiclesError);
          } else {
            console.log('✅ Veículos excluídos com sucesso');
          }
        } catch (vehicleError) {
          console.error('❌ Erro ao excluir veículos:', vehicleError);
        }
        
        // Após excluir os veículos, excluir o orçamento
        const { error } = await supabase
          .from('quotes')
          .delete()
          .eq('id', quoteId);
        
        if (error) {
          console.error('❌ Erro ao excluir orçamento do Supabase:', error);
          return false;
        } else {
          console.log('✅ Orçamento excluído do Supabase com sucesso');
        }
      } else {
        console.log('Orçamento local excluído. Usuário:', getCurrentUser(), 'Orçamento:', quoteToDelete);
      }
    } catch (error) {
      console.error('❌ Erro ao tentar excluir do Supabase:', error);
      return false;
    }
    
    const updatedQuotes = savedQuotes.filter(q => q.id !== quoteId);
    setSavedQuotes(updatedQuotes);
    
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      console.log('✅ Orçamento excluído com sucesso:', quoteId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar localStorage após exclusão:', error);
      return false;
    }
  }, [savedQuotes, getCurrentUser]);

  const loadQuoteForEditing = useCallback(async (quoteId: string): Promise<boolean> => {
    console.log("⏳ Iniciando carregamento de orçamento:", quoteId);
    
    try {
      const quote = savedQuotes.find(q => q.id === quoteId);
      if (!quote) {
        console.error('Orçamento não encontrado:', quoteId);
        return false;
      }
      
      setIsEditMode(true);
      setCurrentEditingQuoteId(quoteId);
      
      console.log('Orçamento carregado para edição:', quoteId);
      return true;
    } catch (error) {
      console.error('Erro ao carregar orçamento para edição:', error);
      return false;
    }
  }, [savedQuotes]);
  
  // Carregar orçamentos salvos do Supabase
  const loadSavedQuotes = async () => {
    try {
      setLoadingSavedQuotes(true);
      
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          title,
          client_id,
          total_value,
          created_at,
          updated_at,
          status,
          status_flow,
          created_by,
          contract_months,
          monthly_km,
          operation_severity,
          has_tracking,
          global_protection_plan_id,
          clients:client_id (name),
          quote_vehicles (
            id,
            vehicle_id,
            total_cost,
            contract_months,
            monthly_km,
            protection_plan_id,
            protection_cost,
            vehicles:vehicle_id (brand, model, plate_number, group_id)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Erro ao carregar orçamentos:', error);
        return [];
      }
      
      // Mapear para o formato SavedQuote
      const mappedQuotes = data?.map((quote: any) => {
        const quoteVehicles = quote.quote_vehicles?.map((qv: any) => ({
          vehicleId: qv.vehicle_id,
          vehicleBrand: qv.vehicles?.brand || 'Sem marca',
          vehicleModel: qv.vehicles?.model || 'Sem modelo',
          totalCost: qv.total_cost,
          contractMonths: qv.contract_months,
          monthlyKm: qv.monthly_km,
          plateNumber: qv.vehicles?.plate_number,
          vehicleGroupId: qv.vehicles?.group_id
        })) || [];
        
        return {
          id: quote.id,
          clientId: quote.client_id,
          clientName: quote.clients?.name || 'Cliente não encontrado',
          vehicles: quoteVehicles,
          totalValue: quote.total_value,
          createdAt: quote.created_at,
          updatedAt: quote.updated_at,
          status: quote.status_flow || quote.status,
          source: 'supabase',
          globalParams: {
            contractMonths: quote.contract_months,
            monthlyKm: quote.monthly_km,
            operationSeverity: quote.operation_severity,
            hasTracking: quote.has_tracking,
            protectionPlanId: quote.global_protection_plan_id,
            includeIpva: false,
            includeLicensing: false,
            includeTaxes: false
          }
        };
      }) || [];
      
      setSavedQuotes(mappedQuotes);
      return mappedQuotes;
      
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      return [];
    } finally {
      setLoadingSavedQuotes(false);
    }
  };

  // Importando a função saveQuoteToSupabase para usar diretamente
  const saveQuoteToSupabase = async (quoteData: any) => {
    try {
      // Remover completamente o campo created_by para evitar o erro de chave estrangeira
      const { created_by, ...quoteDataWithoutCreatedBy } = quoteData;
      
      console.log("Preparando dados para salvar no Supabase (sem created_by):", quoteDataWithoutCreatedBy);
      
      const { data, error } = await supabase
        .from('quotes')
        .insert(quoteDataWithoutCreatedBy)
        .select();
        
      if (error) {
        console.error("Erro ao salvar orçamento via serviço integrado:", error);
        return { success: false, error };
      }
      
      console.log("Orçamento salvo com sucesso via serviço integrado:", data);
      return { success: true, quote: data[0] };
    } catch (error) {
      console.error("Erro inesperado ao salvar orçamento via serviço integrado:", error);
      return { success: false, error };
    }
  };

  return {
    savedQuotes,
    isEditMode,
    currentEditingQuoteId,
    saveQuote,
    updateQuote,
    deleteQuote,
    loadQuoteForEditing
  };
}
