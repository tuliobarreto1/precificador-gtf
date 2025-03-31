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
      
      // Armazenar as promessas para inserção de veículos e relacionamentos
      const quoteVehiclePromises = [];
      
      // Processar cada veículo
      for (let i = 0; i < quote.vehicles.length; i++) {
        const vehicleItem = quote.vehicles[i];
        console.log("Processando item do veículo:", vehicleItem);
        
        // CORREÇÃO: Lidar com diferentes estruturas de veículos
        let vehicle;
        
        // Se vehicleItem tem a propriedade 'vehicle', use-a diretamente
        if (vehicleItem.vehicle) {
          vehicle = vehicleItem.vehicle;
          console.log("Usando vehicle do objeto vehicleItem:", vehicle);
        } 
        // Se vehicleItem tem a propriedade 'vehicleId', pode ser um veículo do formato da tabela
        else if (vehicleItem.vehicleId) {
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
        
        // CORREÇÃO: Se vehicleItem não tem estrutura reconhecida
        if (!vehicle) {
          console.error("Veículo com estrutura não reconhecida:", vehicleItem);
          continue;
        }
        
        console.log("Dados do veículo para processamento:", vehicle);

        // Verificar se o veículo já existe no Supabase ou se é um veículo novo
        let vehicleId = null;
        
        // IMPORTANTE: Sempre criar um novo ID UUID para cada veículo
        // Isso garante que múltiplos veículos do mesmo modelo sejam adicionados individualmente
        if (vehicle.plateNumber || vehicle.plate_number) {
          // Veículos com placa (usados) - verificar se já existem no banco
          const plateToSearch = vehicle.plateNumber || vehicle.plate_number;
          console.log(`Buscando veículo pela placa: ${plateToSearch}`);
          
          const { data: existingVehicles } = await supabase
            .from('vehicles')
            .select('id')
            .eq('plate_number', plateToSearch)
            .limit(1);
            
          if (existingVehicles && Array.isArray(existingVehicles) && existingVehicles.length > 0) {
            vehicleId = existingVehicles[0].id;
            console.log("Veículo existente encontrado pela placa:", vehicleId);
            
            // Atualizar os dados do veículo existente
            const updateData = {
              brand: vehicle.brand || 'Não especificado',
              model: vehicle.model || 'Não especificado',
              year: parseInt(vehicle.year as any) || new Date().getFullYear(),
              value: parseFloat(vehicle.value as any) || 0,
              is_used: true, // Veículos com placa são sempre usados
              group_id: vehicle.groupId || vehicle.group_id || 'A',
              color: vehicle.color || null,
              odometer: parseInt(vehicle.odometer as any) || 0,
              fuel_type: vehicle.fuelType || vehicle.fuel_type || 'Flex'
            };
            
            console.log("Atualizando veículo existente com dados:", updateData);
            
            const { error: updateError } = await supabase
              .from('vehicles')
              .update(updateData)
              .eq('id', vehicleId);
              
            if (updateError) {
              console.error("Erro ao atualizar dados do veículo:", updateError);
            }
          } else {
            // Cria um novo veículo com placa (usado)
            vehicleId = uuidv4(); // Gera um novo UUID para cada veículo
            
            const vehicleData = {
              id: vehicleId,
              brand: vehicle.brand || 'Não especificado',
              model: vehicle.model || 'Não especificado',
              year: parseInt(vehicle.year as any) || new Date().getFullYear(),
              value: parseFloat(vehicle.value as any) || 0,
              plate_number: plateToSearch,
              is_used: true, // Veículos com placa são sempre usados
              group_id: vehicle.groupId || vehicle.group_id || 'A',
              color: vehicle.color || null,
              odometer: parseInt(vehicle.odometer as any) || 0,
              fuel_type: vehicle.fuelType || vehicle.fuel_type || 'Flex'
            };
            
            console.log("Criando novo veículo usado com placa:", vehicleData);
            
            const { error: insertError } = await supabase
              .from('vehicles')
              .insert(vehicleData);
              
            if (insertError) {
              console.error("Erro ao criar veículo usado:", insertError);
              continue;
            }
          }
        } else {
          // Veículos novos (sem placa) - SEMPRE criar um novo registro
          // Isso permite adicionar múltiplos veículos do mesmo modelo
          vehicleId = uuidv4(); // Gera um novo UUID para cada veículo
          
          const vehicleData = {
            id: vehicleId,
            brand: vehicle.brand || 'Não especificado',
            model: vehicle.model || 'Não especificado',
            year: parseInt(vehicle.year as any) || new Date().getFullYear(),
            value: parseFloat(vehicle.value as any) || 0,
            plate_number: null,
            is_used: false, // Veículos sem placa são sempre novos
            group_id: vehicle.groupId || vehicle.group_id || 'A',
            color: vehicle.color || null,
            odometer: parseInt(vehicle.odometer as any) || 0,
            fuel_type: vehicle.fuelType || vehicle.fuel_type || 'Flex'
          };
          
          console.log("Criando novo veículo sem placa:", vehicleData);
          
          const { error: insertError } = await supabase
            .from('vehicles')
            .insert(vehicleData);
            
          if (insertError) {
            console.error("Erro ao criar veículo novo:", insertError);
            continue;
          }
        }
        
        if (!vehicleId) {
          console.error("Não foi possível obter ou criar um ID para o veículo, pulando...");
          continue;
        }
        
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
          const vehicleResult = quoteResults.find(r => r.vehicleId === vehicle.id);
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
        
        console.log("Inserindo relação na tabela quote_vehicles:", quoteVehicleData);
        
        // Adicionar a promessa ao array de promessas
        const insertPromise = supabase
          .from('quote_vehicles')
          .insert(quoteVehicleData);
          
        quoteVehiclePromises.push(insertPromise);
      }
      
      // Aguardar todas as inserções de relacionamentos veículo-orçamento
      if (quoteVehiclePromises.length > 0) {
        console.log(`Aguardando conclusão de ${quoteVehiclePromises.length} inserções de relações...`);
        const results = await Promise.allSettled(quoteVehiclePromises);
        
        // Log de resultados
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`Inserções concluídas: ${successCount} sucesso, ${failureCount} falhas`);
        
        // Log de erros de inserção para diagnóstico
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Erro na inserção da relação do veículo ${index}:`, result.reason);
          }
        });
      } else {
        console.log("Nenhuma relação de veículo para inserir");
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
