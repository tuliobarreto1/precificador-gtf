import { useState, useEffect, useCallback } from 'react';
import { QuoteFormData, SavedQuote, QuoteCalculationResult, User, EditRecord } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { getClientById, getVehicleById } from '@/lib/data-provider';
import { Client, Vehicle } from '@/lib/models';

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
      
      // Obter informações do usuário atual
      const currentUser = getCurrentUser();
      const userId = typeof currentUser === 'string' ? currentUser : currentUser.id;
      
      // Preparar dados do orçamento
      const quoteData: any = {
        client_id: quoteForm.client.id,
        contract_months: quoteForm.globalParams.contractMonths,
        monthly_km: quoteForm.globalParams.monthlyKm,
        operation_severity: quoteForm.globalParams.operationSeverity,
        has_tracking: quoteForm.globalParams.hasTracking,
        global_protection_plan_id: quoteForm.globalParams.protectionPlanId,
        total_value: totalCost,
        created_by: userId,
        title: `Orçamento para ${quoteForm.client.name} - ${quoteForm.vehicles.length} veículo(s)`,
        monthly_values: totalCost // Garantir que o valor mensal seja salvo
      };
      
      console.log("📊 Dados do orçamento a serem enviados:", quoteData);
      
      let savedQuoteId;
      let success = false;
      
      if (isEditMode && currentEditingQuoteId) {
        // Atualizar orçamento existente
        console.log("🔄 Atualizando orçamento existente:", currentEditingQuoteId);
        
        const { data, error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', currentEditingQuoteId)
          .select();
          
        if (error) {
          console.error('❌ Erro ao atualizar orçamento:', error);
          console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
          return false;
        }
        
        if (!data || data.length === 0) {
          console.error('❌ Nenhum dado retornado após atualização do orçamento');
          return false;
        }
        
        savedQuoteId = currentEditingQuoteId;
        success = true;
        console.log('✅ Orçamento atualizado com sucesso:', data[0]);
        
        // Excluir veículos existentes para adicionar os atuais
        const { error: deleteError } = await supabase
          .from('quote_vehicles')
          .delete()
          .eq('quote_id', savedQuoteId);
          
        if (deleteError) {
          console.error('⚠️ Erro ao remover veículos antigos:', deleteError);
          // Continuar mesmo com erro
        } else {
          console.log('✅ Veículos antigos removidos com sucesso');
        }
      } else {
        // Criar novo orçamento
        console.log("🔄 Criando novo orçamento");
        
        const { data, error } = await supabase
          .from('quotes')
          .insert(quoteData)
          .select();
          
        if (error) {
          console.error('❌ Erro ao salvar orçamento:', error);
          console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
          console.error('Dados que tentamos inserir:', JSON.stringify(quoteData, null, 2));
          return false;
        }
        
        if (!data || data.length === 0) {
          console.error('❌ Nenhum dado retornado após criação do orçamento');
          return false;
        }
        
        savedQuoteId = data[0].id;
        success = true;
        console.log('✅ Orçamento criado com sucesso:', data[0]);
      }
      
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
          
        const vehicleData = {
          quote_id: savedQuoteId,
          vehicle_id: vehicleItem.vehicle.id,
          contract_months: params.contractMonths,
          monthly_km: params.monthlyKm,
          operation_severity: params.operationSeverity,
          has_tracking: params.hasTracking,
          protection_plan_id: params.protectionPlanId,
          protection_cost: vehicleResult.protectionCost || 0,
          depreciation_cost: vehicleResult.depreciationCost,
          maintenance_cost: vehicleResult.maintenanceCost,
          extra_km_rate: vehicleResult.extraKmRate,
          total_cost: vehicleResult.totalCost,
          monthly_value: vehicleResult.totalCost
        };
        
        console.log(`🚗 Adicionando veículo ${i+1}/${quoteForm.vehicles.length}:`, 
          `${vehicleItem.vehicle.brand} ${vehicleItem.vehicle.model}`,
          `- Custo mensal: R$ ${vehicleResult.totalCost.toFixed(2)}`);
        
        const { error } = await supabase
          .from('quote_vehicles')
          .insert(vehicleData);
          
        if (error) {
          console.error(`❌ Erro ao salvar veículo ${vehicleItem.vehicle.id}:`, error);
          console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
          // Continuar mesmo se houver erro em um veículo
        } else {
          console.log(`✅ Veículo ${i+1} salvo com sucesso`);
        }
      }
      
      if (success) {
        // Atualizar lista de orçamentos salvos
        await loadSavedQuotes();
        
        console.log('🎉 Orçamento salvo com sucesso!', savedQuoteId);
        
        if (isEditMode) {
          setIsEditMode(false);
          setCurrentEditingQuoteId(null);
        }
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar orçamento:', error);
      return false;
    }
  };

  const updateQuote = (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string): boolean => {
    const quoteToUpdate = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToUpdate) return false;
    
    const editRecord: EditRecord = {
      editedAt: new Date().toISOString(),
      editedBy: getCurrentUser().name,
      changes: changeDescription
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
                value: quoteToDelete.totalValue || quoteToDelete.totalCost || 0
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
      const quotes: SavedQuote[] = data?.map((quote: any) => {
        const quoteVehicles = quote.quote_vehicles?.map((qv: any) => ({
          vehicleId: qv.vehicle_id,
          vehicleBrand: qv.vehicles?.brand || 'Sem marca',
          vehicleModel: qv.vehicles?.model || 'Sem modelo',
          totalCost: qv.total_cost,
          contractMonths: qv.contract_months,
          monthlyKm: qv.monthly_km,
          plateNumber: qv.vehicles?.plate_number,
          groupId: qv.vehicles?.group_id,
          protectionPlanId: qv.protection_plan_id,
          protectionCost: qv.protection_cost
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
            protectionPlanId: quote.global_protection_plan_id
          }
        };
      }) || [];
      
      setSavedQuotes(quotes);
      return quotes;
      
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      return [];
    } finally {
      setLoadingSavedQuotes(false);
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
