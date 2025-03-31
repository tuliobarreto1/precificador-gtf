import { supabase } from '../core/client';
import { saveClientToSupabase } from './clients';
import { v4 as uuidv4 } from 'uuid';
import { getQuoteVehicles } from './quoteVehicles';

// Função para salvar orçamento no Supabase
export async function saveQuoteToSupabase(quote: any) {
  try {
    console.log("Iniciando salvamento de orçamento no Supabase:", quote);
    
    let userId = null;
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      const adminUser = JSON.parse(adminUserStr);
      userId = adminUser.id;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
      }
    }
    
    // Salvar cliente
    const clientResult = await saveClientToSupabase(quote.client);
    if (!clientResult.success) {
      console.error("Erro ao salvar cliente:", clientResult.error);
      return { success: false, error: clientResult.error };
    }

    const isValidUuid = !!quote.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(quote.id);
    const quoteId = isValidUuid ? quote.id : uuidv4();
    const clientUuid = clientResult.data.id;
    
    // Dados principais do orçamento
    const quoteData: any = {
      id: quoteId,
      client_id: clientUuid,
      contract_months: quote.contractMonths || quote.globalParams?.contractMonths || 12,
      monthly_km: quote.monthlyKm || quote.globalParams?.monthlyKm || 2000,
      operation_severity: quote.operationSeverity || quote.globalParams?.operationSeverity || 3,
      has_tracking: quote.hasTracking || quote.globalParams?.hasTracking || false,
      total_value: quote.totalCost || 0,
      status: 'active',
      title: quote.title || `Orçamento ${new Date().toLocaleDateString('pt-BR')}`,
      created_by: userId
    };
    
    console.log("Salvando orçamento com dados:", quoteData);
    
    const { data, error } = await supabase
      .from('quotes')
      .upsert(quoteData)
      .select();

    if (error) {
      console.error("Erro ao salvar orçamento:", error);
      return { success: false, error };
    }
    
    console.log("Orçamento salvo com sucesso. ID:", quoteId);
    
    // Salvar veículos associados ao orçamento
    if (quote.vehicles && quote.vehicles.length > 0) {
      console.log(`Processando ${quote.vehicles.length} veículos para salvar...`);
      
      // Primeiro, removemos quaisquer associações existentes se estiver atualizando um orçamento
      if (isValidUuid) {
        console.log("Removendo associações de veículos existentes para orçamento:", quoteId);
        const { error: deleteError } = await supabase
          .from('quote_vehicles')
          .delete()
          .eq('quote_id', quoteId);
          
        if (deleteError) {
          console.error("Erro ao remover associações de veículos existentes:", deleteError);
        }
      }
      
      // Extrair resultados de cálculo se disponíveis
      let quoteResults = null;
      if (quote.vehicleResults && Array.isArray(quote.vehicleResults)) {
        console.log("Usando resultados de cálculo pré-existentes:", quote.vehicleResults);
        quoteResults = quote.vehicleResults;
      } else if (quote.result && quote.result.vehicleResults) {
        console.log("Usando resultados de cálculo do objeto result:", quote.result.vehicleResults);
        quoteResults = quote.result.vehicleResults;
      }
      
      // Promessas para inserções de veículos
      const vehicleInsertPromises = [];
      
      // Processar cada veículo
      for (let i = 0; i < quote.vehicles.length; i++) {
        const vehicleItem = quote.vehicles[i];
        console.log("Processando item do veículo:", vehicleItem);
        
        // Determinar o veículo a partir do item
        let vehicle;
        
        // Se vehicleItem tem a propriedade 'vehicle', use-a diretamente
        if (vehicleItem.vehicle) {
          vehicle = vehicleItem.vehicle;
          console.log("Usando vehicle do objeto vehicleItem:", vehicle);
        } 
        // Se vehicleItem tem a propriedade 'vehicleId', pode ser um veículo do formato da tabela
        else if (vehicleItem.vehicleId) {
          // Criar um objeto de veículo a partir dos dados disponíveis no vehicleItem
          vehicle = {
            id: vehicleItem.vehicleId,
            brand: vehicleItem.vehicleBrand || "",
            model: vehicleItem.vehicleModel || "",
            year: vehicleItem.year || new Date().getFullYear(),
            value: vehicleItem.value || 0,
            plateNumber: vehicleItem.plateNumber || null,
            isUsed: vehicleItem.isUsed || false,
            groupId: vehicleItem.groupId || "A",
            color: vehicleItem.color || null,
            odometer: vehicleItem.odometer || 0,
            fuelType: vehicleItem.fuelType || null
          };
          console.log("Construindo objeto vehicle a partir dos campos:", vehicle);
        }
        // Se não há estrutura específica, usar o próprio item como veículo
        else {
          vehicle = vehicleItem;
          console.log("Usando o próprio vehicleItem como veículo:", vehicle);
        }
        
        // Se vehicleItem não tem estrutura reconhecida
        if (!vehicle) {
          console.error("Veículo com estrutura não reconhecida:", vehicleItem);
          continue;
        }
        
        console.log("Dados do veículo para processamento:", vehicle);

        // CORREÇÃO IMPORTANTE: Cada veículo deve ser tratado como uma entidade separada
        // Precisamos criar uma nova entrada na tabela vehicles para cada veículo
        // mesmo que sejam do mesmo modelo
        
        console.log("Criando entrada para veículo na tabela vehicles...");
        
        // Preparar dados para inserção do veículo
        const vehicleData = {
          brand: vehicle.brand || 'Não especificado',
          model: vehicle.model || 'Não especificado',
          year: parseInt(vehicle.year as any) || new Date().getFullYear(),
          value: parseFloat(vehicle.value as any) || 0,
          plate_number: vehicle.plateNumber || vehicle.plate_number || null,
          is_used: vehicle.plateNumber || vehicle.plate_number ? true : (vehicle.isUsed === true || vehicle.is_used === true),
          group_id: vehicle.groupId || vehicle.group_id || 'A',
          color: vehicle.color || null,
          odometer: parseInt(vehicle.odometer as any) || 0,
          fuel_type: vehicle.fuelType || vehicle.fuel_type || 'Flex'
        };
        
        console.log("Dados formatados do veículo para inserção:", vehicleData);
        
        // SEMPRE criar um novo registro de veículo, mesmo para veículos novos do mesmo modelo
        try {
          const { data: newVehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .insert(vehicleData)
            .select();
            
          if (vehicleError) {
            console.error("Erro ao criar veículo:", vehicleError);
            continue;
          } else if (newVehicle && Array.isArray(newVehicle) && newVehicle.length > 0) {
            const vehicleId = newVehicle[0].id;
            console.log("Veículo criado com sucesso. ID:", vehicleId);
            
            // Obter parâmetros do veículo
            let params = quote.useGlobalParams 
              ? quote.globalParams 
              : (vehicleItem.params || quote.globalParams);
            
            if (!params) {
              console.log("Parâmetros não encontrados, usando padrões");
              params = {
                contractMonths: quote.contractMonths || 12,
                monthlyKm: quote.monthlyKm || 2000,
                operationSeverity: quote.operationSeverity || 3,
                hasTracking: quote.hasTracking || false
              };
            }
            
            // Determinar valores de custos
            let monthlyValue = 0;
            let depreciationCost = 0;
            let maintenanceCost = 0;
            let extraKmRate = 0;
            let totalCost = 0;
            
            // Verificar se há resultados calculados disponíveis
            if (quoteResults && Array.isArray(quoteResults)) {
              // Para veículos do mesmo modelo, podemos usar o resultado do primeiro
              // já que os cálculos seriam os mesmos
              const vehicleResult = quoteResults.find(r => 
                r.vehicleId === vehicle.id || 
                (r.brand === vehicle.brand && r.model === vehicle.model)
              );
              
              if (vehicleResult) {
                depreciationCost = vehicleResult.depreciationCost || 0;
                maintenanceCost = vehicleResult.maintenanceCost || 0;
                extraKmRate = vehicleResult.extraKmRate || 0;
                totalCost = vehicleResult.totalCost || vehicleResult.monthlyValue || 0;
                monthlyValue = totalCost;
                console.log("Valores calculados encontrados:", {depreciationCost, maintenanceCost, totalCost});
              }
            }
            
            // Se não temos valores calculados, verificar outros campos
            if (totalCost === 0) {
              if (vehicleItem.monthlyValue !== undefined) {
                monthlyValue = vehicleItem.monthlyValue;
                totalCost = monthlyValue;
              } else if (vehicleItem.total_cost !== undefined) {
                totalCost = vehicleItem.total_cost;
                monthlyValue = totalCost;
              } else if (quote.totalCost && quote.vehicles.length > 0) {
                // Dividir o valor total pelo número de veículos como último recurso
                totalCost = quote.totalCost / quote.vehicles.length;
                monthlyValue = totalCost;
              }
              
              console.log("Valor mensal atribuído:", monthlyValue);
            }
            
            // Preparar os dados para inserção na tabela quote_vehicles
            const quoteVehicleData = {
              quote_id: quoteId,
              vehicle_id: vehicleId,
              monthly_value: monthlyValue,
              monthly_km: params.monthlyKm,
              contract_months: params.contractMonths,
              operation_severity: params.operationSeverity,
              has_tracking: params.hasTracking,
              depreciation_cost: depreciationCost,
              maintenance_cost: maintenanceCost,
              extra_km_rate: extraKmRate,
              total_cost: totalCost
            };
            
            console.log("Inserindo veículo na tabela quote_vehicles:", quoteVehicleData);
            
            // Adicionar a promessa ao array
            const insertPromise = supabase
              .from('quote_vehicles')
              .insert(quoteVehicleData)
              .select();
              
            vehicleInsertPromises.push(insertPromise);
          } else {
            console.error("Nenhum veículo retornado após inserção");
          }
        } catch (insertError) {
          console.error("Exceção ao tentar inserir veículo:", insertError);
        }
      }
      
      // Aguardar todas as inserções de veículos
      if (vehicleInsertPromises.length > 0) {
        console.log(`Aguardando conclusão de ${vehicleInsertPromises.length} inserções de veículos...`);
        const results = await Promise.allSettled(vehicleInsertPromises);
        
        // Log de resultados
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`Inserções concluídas: ${successCount} sucesso, ${failureCount} falhas`);
        
        // Log de erros de inserção para diagnóstico
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Erro na inserção do veículo ${index}:`, result.reason);
          }
        });
      } else {
        console.log("Nenhum veículo para inserir");
      }
    } else {
      console.log("Nenhum veículo para associar ao orçamento");
    }
    
    return { success: true, data: [{ id: quoteId }] };
  } catch (error) {
    console.error("Erro inesperado ao salvar orçamento:", error);
    return { success: false, error };
  }
}

// Função para buscar orçamentos no Supabase
export async function getQuotesFromSupabase() {
  try {
    console.log("Buscando orçamentos do Supabase...");
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id(*)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    // Buscar veículos para cada orçamento
    const quotes = Array.isArray(data) ? data : [];
    for (const quote of quotes) {
      const { data: vehiclesData } = await supabase
        .from('quote_vehicles')
        .select(`
          *,
          vehicle:vehicle_id(*)
        `)
        .eq('quote_id', quote.id);
        
      // Adicionar veículos ao objeto de orçamento como propriedade não-tipada
      (quote as any).vehicles = vehiclesData || [];
    }
    
    console.log("Orçamentos recuperados:", quotes.length);
    return { success: true, quotes };
  } catch (error) {
    console.error("Erro inesperado ao buscar orçamentos:", error);
    return { success: false, error, quotes: [] };
  }
}

// Função para buscar um único orçamento pelo ID
export async function getQuoteByIdFromSupabase(quoteId: string) {
  try {
    console.log(`Buscando orçamento com ID: ${quoteId}`);
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id(*)
      `)
      .eq('id', quoteId)
      .single();
      
    if (error) {
      console.error("Erro ao buscar orçamento por ID:", error);
      return { success: false, error };
    }
    
    // Buscar veículos associados a este orçamento
    if (data) {
      const { vehicles, success } = await getQuoteVehicles(quoteId);
      
      if (success && vehicles && Array.isArray(vehicles)) {
        (data as any).vehicles = vehicles;
        console.log(`Veículos associados ao orçamento ${quoteId}:`, vehicles);
      } else {
        (data as any).vehicles = [];
      }
      
      console.log("Orçamento recuperado:", data);
    }
    
    return { success: true, quote: data };
  } catch (error) {
    console.error("Erro inesperado ao buscar orçamento por ID:", error);
    return { success: false, error };
  }
}
