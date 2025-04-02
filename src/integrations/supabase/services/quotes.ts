
import { supabase } from '../client';
import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateVehicle } from './vehicles';

// Função para salvar um orçamento no Supabase
export async function saveQuoteToSupabase(quoteData: any) {
  try {
    console.log("Iniciando salvamento de orçamento:", quoteData);
    
    // Garantir que o quoteId seja um UUID válido
    // Se o ID for um número (timestamp) ou não for um formato UUID válido, gerar um novo
    let quoteId = quoteData.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!quoteId || !uuidRegex.test(quoteId.toString())) {
      quoteId = uuidv4();
      console.log("ID não é um UUID válido, gerando novo ID:", quoteId);
    }
    
    let vehicleId = null;
    
    // Se houver um veículo vinculado diretamente ao orçamento, criar ou salvar primeiro
    if (quoteData.vehicleId) {
      // Verificar se o ID do veículo é um UUID válido, se não for, gerar um novo
      if (!uuidRegex.test(quoteData.vehicleId.toString()) || quoteData.vehicleId.toString().startsWith('new-')) {
        const oldVehicleId = quoteData.vehicleId;
        quoteData.vehicleId = uuidv4();
        console.log("Vehicle ID não é um UUID válido, gerando novo ID:", quoteData.vehicleId);
        
        // Também atualizar o ID do veículo nos dados de veículos do orçamento, se existir
        if (quoteData.vehicles && Array.isArray(quoteData.vehicles)) {
          quoteData.vehicles = quoteData.vehicles.map((v: any) => {
            if (v.vehicle && v.vehicle.id === oldVehicleId) {
              return {
                ...v,
                vehicle: {
                  ...v.vehicle,
                  id: quoteData.vehicleId
                }
              };
            }
            return v;
          });
        }
      }
      
      const vehicleData = {
        id: quoteData.vehicleId,
        brand: quoteData.vehicleBrand || '',
        model: quoteData.vehicleModel || '',
        year: quoteData.vehicleYear || new Date().getFullYear(),
        value: quoteData.vehicleValue || 0,
        plate_number: quoteData.vehiclePlateNumber,
        is_used: quoteData.vehicleIsUsed || false,
        group_id: quoteData.vehicleGroupId
      };
      
      try {
        const { success, data: savedVehicle } = await createOrUpdateVehicle(vehicleData);
        if (success && savedVehicle) {
          vehicleId = savedVehicle.id;
          console.log("Veículo salvo com sucesso:", savedVehicle);
        } else {
          console.warn("Não foi possível salvar o veículo principal, continuando sem ele");
        }
      } catch (vehicleError) {
        console.error("Erro ao salvar veículo principal:", vehicleError);
      }
    }
    
    // Validar e certificar que campos críticos são do tipo correto
    const quoteToSave = {
      id: quoteId,
      title: quoteData.title || `Orçamento ${new Date().toLocaleDateString()}`,
      client_id: typeof quoteData.clientId === 'object' ? null : quoteData.clientId,
      vehicle_id: vehicleId, // Usar o UUID válido gerado ou null se não houver veículo
      contract_months: quoteData.contractMonths || 12,
      monthly_km: quoteData.monthlyKm || 2000,
      operation_severity: quoteData.operationSeverity || 3,
      has_tracking: quoteData.hasTracking || false,
      total_value: quoteData.totalCost || 0,
      monthly_values: quoteData.monthlyValue || 0,
      status: quoteData.status || 'ORCAMENTO',
      status_flow: quoteData.statusFlow || 'ORCAMENTO',
      created_by: typeof quoteData.createdBy === 'object' ? null : quoteData.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Dados formatados para salvar:", quoteToSave);
    
    const { data, error } = await supabase
      .from('quotes')
      .upsert(quoteToSave)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao salvar orçamento:", error);
      return { success: false, error };
    }
    
    console.log("Orçamento salvo com sucesso:", data);
    
    // Se temos veículos para salvar no orçamento
    if (quoteData.vehicles && Array.isArray(quoteData.vehicles) && quoteData.vehicles.length > 0) {
      try {
        console.log(`Processando ${quoteData.vehicles.length} veículos para o orçamento`);
        
        // Para cada veículo no orçamento
        for (const vehicleItem of quoteData.vehicles) {
          // Primeiro, salvar ou atualizar o veículo na tabela vehicles
          const vehicle = vehicleItem.vehicle;
          
          if (!vehicle) {
            console.warn("Item de veículo sem dados de veículo, pulando...");
            continue;
          }
          
          // Preparar dados do veículo para salvar
          const vehicleToSave = {
            id: vehicle.id,
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || new Date().getFullYear(),
            value: vehicle.value || 0,
            plate_number: vehicle.plateNumber,
            color: vehicle.color,
            is_used: vehicle.isUsed || false,
            odometer: vehicle.odometer || 0,
            group_id: vehicle.groupId,
            fuel_type: vehicle.fuelType
          };
          
          // Salvar o veículo na tabela de veículos
          const { success, data: savedVehicle, error: vehicleError } = await createOrUpdateVehicle(vehicleToSave);
          
          if (!success || vehicleError) {
            console.error(`Erro ao salvar veículo ${vehicleToSave.id} para o orçamento:`, vehicleError);
            continue; // Pular para o próximo veículo
          }
          
          console.log(`Veículo salvo com sucesso:`, savedVehicle);
          
          // Agora que o veículo está salvo, adicionar a relação na quote_vehicles
          const vehicleDataToSave = {
            quote_id: quoteId,
            vehicle_id: savedVehicle.id,
            monthly_value: vehicleItem.monthlyValue || vehicleItem.totalCost || 0,
            monthly_km: quoteData.monthlyKm || 2000,
            contract_months: quoteData.contractMonths || 12,
            operation_severity: quoteData.operationSeverity || 3,
            has_tracking: quoteData.hasTracking || false,
            depreciation_cost: vehicleItem.depreciationCost || 0,
            maintenance_cost: vehicleItem.maintenanceCost || 0,
            extra_km_rate: vehicleItem.extraKmRate || 0,
            total_cost: vehicleItem.totalCost || 0
          };
          
          console.log(`Adicionando veículo ao orçamento:`, vehicleDataToSave);
          
          const { error: addVehicleError } = await supabase
            .from('quote_vehicles')
            .upsert(vehicleDataToSave);
            
          if (addVehicleError) {
            console.error(`Erro ao adicionar veículo ${savedVehicle.id} ao orçamento:`, addVehicleError);
          } else {
            console.log(`Veículo ${savedVehicle.id} adicionado com sucesso ao orçamento ${quoteId}`);
          }
        }
        console.log("Veículos adicionados ao orçamento com sucesso");
      } catch (vehicleError) {
        console.error("Erro ao adicionar veículos ao orçamento:", vehicleError);
        // Não falhar o processo principal se os veículos falharem
      }
    }
    
    // Se é uma edição, registrar no log
    if (quoteData.isEdit) {
      try {
        await logQuoteAction(quoteId, 'EDIT', quoteData.createdBy, quoteData.createdByName || 'Usuário', {
          editDetails: 'Orçamento editado',
          editDate: new Date().toISOString()
        });
      } catch (logError) {
        console.error("Erro ao registrar log de edição:", logError);
      }
    }
    
    return { success: true, quote: data };
  } catch (error) {
    console.error("Erro inesperado ao salvar orçamento:", error);
    return { success: false, error };
  }
}

// Função para registrar ações nos orçamentos (edição/exclusão)
export async function logQuoteAction(quoteId: string, actionType: 'EDIT' | 'DELETE', userId?: string, userName?: string, details?: any, deletedData?: any) {
  try {
    console.log(`Registrando ${actionType} para o orçamento ${quoteId}`);
    
    // Buscar título do orçamento se não estiver nos dados deletados
    let quoteTitle = '';
    if (actionType === 'DELETE' && deletedData?.title) {
      quoteTitle = deletedData.title;
    } else {
      const { data } = await supabase
        .from('quotes')
        .select('title')
        .eq('id', quoteId)
        .single();
        
      quoteTitle = data?.title || 'Orçamento sem título';
    }
    
    const logData = {
      quote_id: quoteId,
      quote_title: quoteTitle,
      action_type: actionType,
      user_id: userId,
      user_name: userName,
      action_date: new Date().toISOString(),
      details: details || {},
      deleted_data: deletedData || null
    };
    
    // Usar .rpc() para chamar uma função no banco de dados ou executar SQL diretamente
    // em vez de acessar a tabela diretamente
    const { data, error } = await supabase
      .rpc('insert_quote_action_log', logData);
      
    if (error) {
      console.error(`Erro ao registrar log de ${actionType}:`, error);
      
      // Fallback: inserir usando endpoint genérico se a função RPC falhar
      const { error: fallbackError } = await supabase
        .postgrest
        .schema('public')
        .from('quote_action_logs')
        .insert(logData);
        
      if (fallbackError) {
        console.error(`Fallback também falhou:`, fallbackError);
        return { success: false, error: fallbackError };
      }
    }
    
    console.log(`Log de ${actionType} registrado com sucesso`);
    return { success: true, data };
  } catch (error) {
    console.error(`Erro ao registrar log de ${actionType}:`, error);
    return { success: false, error };
  }
}

// Função para obter todos os orçamentos
export async function getQuotesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id(*),
        vehicles:quote_vehicles(
          *,
          vehicle:vehicle_id(*)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar orçamentos:", error);
      return { success: false, error, quotes: [] };
    }
    
    console.log(`${data?.length || 0} orçamentos recuperados com sucesso`);
    return { success: true, quotes: data || [] };
  } catch (error) {
    console.error("Erro inesperado ao buscar orçamentos:", error);
    return { success: false, error, quotes: [] };
  }
}

// Função para buscar um orçamento pelo ID
export async function getQuoteByIdFromSupabase(id: string) {
  try {
    if (!id) {
      return { success: false, error: "ID não fornecido", quote: null };
    }
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id(*),
        vehicles:quote_vehicles(
          *,
          vehicle:vehicle_id(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.error(`Erro ao buscar orçamento ${id}:`, error);
      return { success: false, error, quote: null };
    }
    
    if (!data) {
      console.log(`Orçamento ${id} não encontrado`);
      return { success: true, quote: null };
    }
    
    console.log(`Orçamento ${id} recuperado com sucesso`);
    return { success: true, quote: data };
  } catch (error) {
    console.error(`Erro inesperado ao buscar orçamento ${id}:`, error);
    return { success: false, error, quote: null };
  }
}

// Função para deletar um orçamento
export async function deleteQuoteFromSupabase(id: string, userId?: string, userName?: string) {
  try {
    // Primeiro, vamos buscar os dados do orçamento para armazenar no log
    const { data: quoteToDelete } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (!quoteToDelete) {
      return { success: false, error: `Orçamento ${id} não encontrado` };
    }
    
    // Excluir os veículos associados ao orçamento
    await supabase
      .from('quote_vehicles')
      .delete()
      .eq('quote_id', id);
    
    // Excluir o orçamento
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erro ao deletar orçamento ${id}:`, error);
      return { success: false, error };
    }
    
    // Registrar a exclusão no log usando SQL diretamente
    try {
      const logData = {
        quote_id: id,
        quote_title: quoteToDelete.title || 'Orçamento sem título',
        action_type: 'DELETE',
        user_id: userId,
        user_name: userName || 'Usuário',
        action_date: new Date().toISOString(),
        details: {
          deleteDate: new Date().toISOString(),
          message: 'Orçamento excluído pelo usuário'
        },
        deleted_data: quoteToDelete
      };

      // Usar .rpc() para chamar uma função no banco de dados
      await supabase
        .rpc('insert_quote_action_log', logData);
    } catch (logError) {
      console.error("Erro ao registrar log de exclusão:", logError);
    }
    
    console.log(`Orçamento ${id} deletado com sucesso`);
    return { success: true };
  } catch (error) {
    console.error(`Erro inesperado ao deletar orçamento ${id}:`, error);
    return { success: false, error };
  }
}

// Função para obter logs de ações nos orçamentos
export async function getQuoteActionLogs(quoteId?: string) {
  try {
    // Como não podemos acessar diretamente a tabela via types, vamos usar uma função RPC
    let result;
    
    if (quoteId) {
      result = await supabase
        .rpc('get_quote_action_logs_by_quote', { quote_id_param: quoteId });
    } else {
      result = await supabase
        .rpc('get_all_quote_action_logs');
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error("Erro ao buscar logs de ações:", error);
      return { success: false, error, logs: [] };
    }
    
    return { success: true, logs: data || [] };
  } catch (error) {
    console.error("Erro ao buscar logs de ações:", error);
    return { success: false, error, logs: [] };
  }
}
