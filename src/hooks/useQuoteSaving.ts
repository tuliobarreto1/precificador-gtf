
import { useState, useEffect, useCallback } from 'react';
import { QuoteFormData, SavedQuote, EditRecord, User, VehicleQuoteResult } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { getClientById, getVehicleById } from '@/lib/data-provider';
import { Client, Vehicle } from '@/lib/models';

// Chave para armazenar orçamentos salvos no localStorage
const SAVED_QUOTES_KEY = 'savedQuotes';

export function useQuoteSaving(
  quoteForm: QuoteFormData, 
  calculateQuote: () => { vehicleResults: VehicleQuoteResult[]; totalCost: number; } | null,
  getCurrentUser: () => User
) {
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditingQuoteId, setCurrentEditingQuoteId] = useState<string | null>(null);

  // Carregar cotações salvas do localStorage na inicialização
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

  // Função para salvar um orçamento
  const saveQuote = (): boolean => {
    const quoteResult = calculateQuote();
    if (!quoteForm.client || !quoteResult || quoteForm.vehicles.length === 0) {
      console.error('Erro ao salvar orçamento: dados incompletos', {
        client: !!quoteForm.client,
        quoteResult: !!quoteResult,
        vehicles: quoteForm.vehicles.length
      });
      return false;
    }

    // Verificar se estamos em modo de edição
    if (isEditMode && currentEditingQuoteId) {
      // Encontrar o orçamento original
      const originalQuote = savedQuotes.find(q => q.id === currentEditingQuoteId);
      if (!originalQuote) {
        console.error('Orçamento original não encontrado:', currentEditingQuoteId);
        return false;
      }

      // Criar descrição das alterações
      const changeDescription = `Orçamento editado em ${new Date().toLocaleString('pt-BR')}`;
      
      // Criar objeto de atualizações
      const updates: Partial<QuoteFormData> = {
        client: quoteForm.client,
        vehicles: quoteForm.vehicles,
        globalParams: quoteForm.globalParams,
        useGlobalParams: quoteForm.useGlobalParams
      };
      
      // Atualizar o orçamento
      const updated = updateQuote(currentEditingQuoteId, updates, changeDescription);
      
      // Resetar o modo de edição
      if (updated) {
        setIsEditMode(false);
        setCurrentEditingQuoteId(null);
      }
      
      return updated;
    }

    // Caso contrário, continuar com a criação de um novo orçamento
    // Criar um ID único baseado no timestamp (será substituído por UUID no Supabase)
    const newId = Date.now().toString();
    
    // Obter o usuário atual
    const userInfo = getCurrentUser();
    
    // Criar o objeto de orçamento salvo
    const newSavedQuote: SavedQuote = {
      id: newId,
      clientId: quoteForm.client.id,
      clientName: quoteForm.client.name,
      vehicleId: quoteForm.vehicles[0].vehicle.id, // Para compatibilidade com o formato atual
      vehicleBrand: quoteForm.vehicles[0].vehicle.brand,
      vehicleModel: quoteForm.vehicles[0].vehicle.model,
      contractMonths: quoteForm.globalParams.contractMonths,
      monthlyKm: quoteForm.globalParams.monthlyKm,
      totalCost: quoteResult.totalCost,
      createdAt: new Date().toISOString(),
      createdBy: userInfo, // Usar o usuário atual
      editHistory: [],
      vehicles: quoteResult.vehicleResults.map((result, index) => {
        const vehicle = quoteForm.vehicles.find(v => v.vehicle.id === result.vehicleId);
        if (!vehicle) {
          throw new Error(`Veículo não encontrado: ${result.vehicleId}`);
        }
        
        return {
          vehicleId: vehicle.vehicle.id,
          vehicleBrand: vehicle.vehicle.brand,
          vehicleModel: vehicle.vehicle.model,
          plateNumber: vehicle.vehicle.plateNumber,
          groupId: vehicle.vehicleGroup.id,
          totalCost: result.totalCost,
          depreciationCost: result.depreciationCost,
          maintenanceCost: result.maintenanceCost,
          extraKmRate: result.extraKmRate,
        };
      }),
      operationSeverity: quoteForm.globalParams.operationSeverity,
      hasTracking: quoteForm.globalParams.hasTracking,
      trackingCost: quoteResult.vehicleResults[0].trackingCost,
      status: 'active',
      source: 'local'
    };

    console.log('📝 Tentando salvar novo orçamento:', {
      clientId: newSavedQuote.clientId,
      clientName: newSavedQuote.clientName,
      totalCost: newSavedQuote.totalCost,
      veículos: newSavedQuote.vehicles.length
    });

    // Também salvar no Supabase e atualizar o ID local se salvo com sucesso
    let finalQuote = { ...newSavedQuote };
    try {
      import('@/integrations/supabase/services/quotes').then(async ({ saveQuoteToSupabase }) => {
        console.log('📤 Iniciando salvamento no Supabase...');
        
        // Preparar os dados completos para o salvamento
        const quoteDataForSupabase = {
          ...newSavedQuote,
          client: quoteForm.client,
          // Incluir os detalhes completos dos veículos para garantir que todos os dados necessários estejam disponíveis
          vehicles: quoteForm.vehicles.map((vehicleItem, index) => {
            const result = quoteResult.vehicleResults.find(r => r.vehicleId === vehicleItem.vehicle.id);
            return {
              vehicle: vehicleItem.vehicle,
              vehicleId: vehicleItem.vehicle.id,
              vehicleGroup: vehicleItem.vehicleGroup,
              totalCost: result?.totalCost || 0,
              depreciationCost: result?.depreciationCost || 0,
              maintenanceCost: result?.maintenanceCost || 0,
              extraKmRate: result?.extraKmRate || 0,
              monthly_value: result?.totalCost || 0,
              contract_months: quoteForm.globalParams.contractMonths,
              monthly_km: quoteForm.globalParams.monthlyKm,
              operation_severity: quoteForm.globalParams.operationSeverity,
              has_tracking: quoteForm.globalParams.hasTracking
            };
          })
        };
        
        const result = await saveQuoteToSupabase(quoteDataForSupabase);
        
        if (result.success && result.quote && result.quote.id) {
          console.log('✅ Orçamento salvo no Supabase com sucesso!', result.quote);
          
          // Atualizar o ID local com o UUID gerado pelo Supabase
          const supabaseId = result.quote.id;
          
          // Atualizar o orçamento local com o ID do Supabase
          setSavedQuotes(prevQuotes => 
            prevQuotes.map(q => 
              q.id === newSavedQuote.id ? { ...q, id: supabaseId } : q
            )
          );
          
          // Atualizar também no localStorage
          try {
            const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
            if (storedQuotes) {
              const parsedQuotes = JSON.parse(storedQuotes);
              const updatedQuotes = parsedQuotes.map((q: SavedQuote) => 
                q.id === newSavedQuote.id ? { ...q, id: supabaseId } : q
              );
              localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
              console.log('✅ ID do orçamento atualizado no localStorage para UUID do Supabase');
            }
          } catch (error) {
            console.error('❌ Erro ao atualizar ID no localStorage:', error);
          }
          
        } else {
          console.error('❌ Falha ao salvar orçamento no Supabase:', result.error);
        }
      }).catch(err => {
        console.error('❌ Erro ao importar função do Supabase:', err);
      });
    } catch (error) {
      console.error('❌ Erro ao tentar salvar no Supabase:', error);
      // Continuar salvando localmente mesmo se falhar no Supabase
    }

    // Atualizar o estado e o localStorage
    const updatedQuotes = [newSavedQuote, ...savedQuotes];
    setSavedQuotes(updatedQuotes);
    
    // Salvar no localStorage com tratamento de erro
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      console.log('✅ Orçamento salvo com sucesso no localStorage:', newSavedQuote);
      console.log('📊 Total de orçamentos salvos:', updatedQuotes.length);
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
      return false;
    }
    
    return true;
  };

  // Função para atualizar um orçamento existente
  const updateQuote = (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string): boolean => {
    // Encontrar o orçamento a ser atualizado
    const quoteToUpdate = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToUpdate) return false;
    
    // Registrar a edição no histórico
    const editRecord: EditRecord = {
      editedAt: new Date().toISOString(),
      editedBy: getCurrentUser(),
      changes: changeDescription
    };

    // Calcular os novos valores do orçamento
    const quoteResult = calculateQuote();
    if (!quoteResult) {
      console.error('Erro ao calcular o oramento atualizado');
      return false;
    }
    
    // Atualizar o orçamento
    const updatedQuotes = savedQuotes.map(quote => {
      if (quote.id === quoteId) {
        return {
          ...quote,
          clientId: updates.client?.id || quote.clientId,
          clientName: updates.client?.name || quote.clientName,
          contractMonths: updates.globalParams?.contractMonths || quote.contractMonths,
          monthlyKm: updates.globalParams?.monthlyKm || quote.monthlyKm,
          totalCost: quoteResult.totalCost,
          operationSeverity: updates.globalParams?.operationSeverity || quote.operationSeverity,
          hasTracking: updates.globalParams?.hasTracking !== undefined ? updates.globalParams.hasTracking : quote.hasTracking,
          vehicles: quoteResult.vehicleResults.map(result => {
            const vehicleItem = updates.vehicles?.find(v => v.vehicle.id === result.vehicleId);
            
            if (!vehicleItem) {
              // Se não encontrou o veículo nas atualizações, manter o veículo original
              const originalVehicle = quote.vehicles.find(v => v.vehicleId === result.vehicleId);
              if (originalVehicle) return originalVehicle;
              
              // Se não encontrou nem nas atualizações nem no original, algo está errado
              throw new Error(`Veículo não encontrado: ${result.vehicleId}`);
            }
            
            return {
              vehicleId: vehicleItem.vehicle.id,
              vehicleBrand: vehicleItem.vehicle.brand,
              vehicleModel: vehicleItem.vehicle.model,
              plateNumber: vehicleItem.vehicle.plateNumber,
              groupId: vehicleItem.vehicleGroup?.id || quote.vehicles[0].groupId,
              totalCost: result.totalCost,
              depreciationCost: result.depreciationCost,
              maintenanceCost: result.maintenanceCost,
              extraKmRate: result.extraKmRate,
            };
          }),
          editHistory: [...(quote.editHistory || []), editRecord]
        };
      }
      return quote;
    });
    
    // Salvar as alterações
    setSavedQuotes(updatedQuotes);
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
    console.log('Orçamento atualizado com sucesso:', quoteId);
    
    // Registrar o log de edição no Supabase
    if (quoteToUpdate.source === 'supabase') {
      try {
        const userInfo = getCurrentUser();
        
        // Usar a função dedicada para registrar logs de ação em vez de inserção direta
        import('@/integrations/supabase/services/quoteActionLogs').then(async ({ createQuoteActionLog }) => {
          await createQuoteActionLog({
            quote_id: quoteId,
            quote_title: quoteToUpdate.clientName,
            action_type: 'EDIT',
            user_id: userInfo.id.toString(),
            user_name: userInfo.name,
            details: {
              description: changeDescription,
              previous: {
                contractMonths: quoteToUpdate.contractMonths,
                monthlyKm: quoteToUpdate.monthlyKm,
                totalCost: quoteToUpdate.totalCost
              },
              new: {
                contractMonths: updates.globalParams?.contractMonths,
                monthlyKm: updates.globalParams?.monthlyKm,
                totalCost: quoteResult.totalCost
              }
            }
          });
          console.log('✅ Log de edição registrado com sucesso');
        }).catch(logError => {
          console.error('❌ Erro ao registrar log de edição:', logError);
        });
      } catch (logError) {
        console.error('❌ Erro ao registrar log de edição:', logError);
      }
    }
    
    return true;
  };

  // Delete quote implementation 
  const deleteQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    console.log("🗑️ Tentando excluir orçamento:", quoteId);
    
    // Verificar se o orçamento existe
    const quoteToDelete = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToDelete) {
      console.error('❌ Orçamento não encontrado:', quoteId);
      return false;
    }
    
    // Também excluir do Supabase se for um orçamento armazenado lá
    try {
      if (quoteToDelete.source === 'supabase') {
        console.log("🔄 Excluindo orçamento do Supabase...");
        
        // Registrar o log de exclusão primeiro
        const userInfo = getCurrentUser();
        try {
          // Usar a função dedicada para registrar logs de ação em vez de inserção direta
          import('@/integrations/supabase/services/quoteActionLogs').then(async ({ createQuoteActionLog }) => {
            await createQuoteActionLog({
              quote_id: quoteId,
              quote_title: quoteToDelete.clientName,
              action_type: 'DELETE',
              user_id: userInfo.id.toString(),
              user_name: userInfo.name,
              details: {
                status: quoteToDelete.status,
                value: quoteToDelete.totalCost
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
        
        // Agora excluir o orçamento
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
        // Para orçamentos locais, podemos apenas registrar a ação em logs de console
        console.log('Orçamento local excluído. Usuário:', getCurrentUser().name, 'Orçamento:', quoteToDelete);
      }
    } catch (error) {
      console.error('❌ Erro ao tentar excluir do Supabase:', error);
      // Continuar excluindo localmente mesmo se falhar no Supabase
    }
    
    // Remover o orçamento
    const updatedQuotes = savedQuotes.filter(q => q.id !== quoteId);
    setSavedQuotes(updatedQuotes);
    
    // Atualizar o localStorage
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      console.log('✅ Orçamento excluído com sucesso:', quoteId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar localStorage após exclusão:', error);
      return false;
    }
  }, [savedQuotes, getCurrentUser]);

  // Função melhorada para carregar um orçamento para edição
  const loadQuoteForEditing = useCallback(async (quoteId: string): Promise<boolean> => {
    console.log("⏳ Iniciando carregamento de orçamento:", quoteId);
    
    try {
      // Buscar o orçamento pelo ID
      const quote = savedQuotes.find(q => q.id === quoteId);
      if (!quote) {
        console.error('Orçamento não encontrado:', quoteId);
        return false;
      }
      
      // Ativar o modo de edição
      setIsEditMode(true);
      setCurrentEditingQuoteId(quoteId);
      
      console.log('Orçamento carregado para edição:', quoteId);
      return true;
    } catch (error) {
      console.error('Erro ao carregar orçamento para edição:', error);
      return false;
    }
  }, [savedQuotes]);

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
