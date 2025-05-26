
import { supabase } from '@/integrations/supabase/client';
import { SqlVehicle } from './sql-connection';

// Interface para o status da sincronização
export interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentTask: string;
  totalVehicles: number;
  processedVehicles: number;
  errors: string[];
  lastSync?: Date;
}

// Função para buscar todos os veículos da API da Locavia
export const getAllVehiclesFromLocavia = async (
  onProgress?: (status: SyncStatus) => void
): Promise<{ success: boolean; vehicles: SqlVehicle[]; errors: string[] }> => {
  const errors: string[] = [];
  let allVehicles: SqlVehicle[] = [];
  
  try {
    console.log('🔄 Iniciando sincronização completa de veículos da Locavia...');
    
    if (onProgress) {
      onProgress({
        isRunning: true,
        progress: 10,
        currentTask: 'Conectando com a API da Locavia...',
        totalVehicles: 0,
        processedVehicles: 0,
        errors: []
      });
    }

    // Buscar todos os veículos da API da Locavia
    const response = await fetch('http://localhost:3005/api/vehicles/all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout maior para buscar todos os veículos
      signal: AbortSignal.timeout(120000) // 2 minutos
    });

    if (!response.ok) {
      throw new Error(`Erro na API da Locavia: ${response.status} ${response.statusText}`);
    }

    const vehicles = await response.json();
    
    if (!Array.isArray(vehicles)) {
      throw new Error('Formato de resposta inválido da API da Locavia');
    }

    allVehicles = vehicles;
    console.log(`✅ ${allVehicles.length} veículos obtidos da API da Locavia`);

    if (onProgress) {
      onProgress({
        isRunning: true,
        progress: 50,
        currentTask: `${allVehicles.length} veículos obtidos. Salvando no cache...`,
        totalVehicles: allVehicles.length,
        processedVehicles: 0,
        errors: []
      });
    }

    return { success: true, vehicles: allVehicles, errors };
    
  } catch (error) {
    console.error('❌ Erro ao buscar todos os veículos da Locavia:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    errors.push(errorMessage);
    
    return { success: false, vehicles: [], errors };
  }
};

// Função para salvar todos os veículos no cache do Supabase
export const saveAllVehiclesToCache = async (
  vehicles: SqlVehicle[],
  onProgress?: (status: SyncStatus) => void
): Promise<{ success: boolean; savedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let savedCount = 0;
  const batchSize = 50; // Processar em lotes de 50 veículos
  
  try {
    console.log(`💾 Iniciando salvamento de ${vehicles.length} veículos no cache...`);
    
    // Primeiro, salvar na tabela locavia_vehicles_cache
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      
      if (onProgress) {
        onProgress({
          isRunning: true,
          progress: 50 + (i / vehicles.length) * 40,
          currentTask: `Salvando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(vehicles.length / batchSize)} no cache da Locavia...`,
          totalVehicles: vehicles.length,
          processedVehicles: i,
          errors: []
        });
      }

      const cacheData = batch.map(vehicle => ({
        codigo_mva: vehicle.CodigoMVA,
        placa: vehicle.Placa,
        codigo_modelo: vehicle.CodigoModelo,
        descricao_modelo: vehicle.DescricaoModelo,
        codigo_grupo_veiculo: vehicle.CodigoGrupoVeiculo,
        letra_grupo: vehicle.LetraGrupo,
        descricao_grupo: vehicle.DescricaoGrupo,
        ano_fabricacao_modelo: vehicle.AnoFabricacaoModelo,
        cor: vehicle.Cor || null,
        tipo_combustivel: vehicle.TipoCombustivel || null,
        numero_passageiros: vehicle.NumeroPassageiros || 5,
        odometro_atual: vehicle.OdometroAtual || 0,
        status: vehicle.Status || null,
        descricao_status: vehicle.DescricaoStatus || null,
        valor_compra: vehicle.ValorCompra || 0,
        data_compra: vehicle.DataCompra || null
      }));

      const { error: cacheError } = await supabase
        .from('locavia_vehicles_cache')
        .upsert(cacheData, { 
          onConflict: 'placa',
          ignoreDuplicates: false 
        });

      if (cacheError) {
        console.error(`❌ Erro ao salvar lote ${Math.floor(i / batchSize) + 1} no cache da Locavia:`, cacheError);
        errors.push(`Erro no lote ${Math.floor(i / batchSize) + 1}: ${cacheError.message}`);
      } else {
        savedCount += batch.length;
      }
    }

    // Depois, salvar na tabela vehicles para compatibilidade
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      
      if (onProgress) {
        onProgress({
          isRunning: true,
          progress: 90 + (i / vehicles.length) * 10,
          currentTask: `Salvando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(vehicles.length / batchSize)} na tabela principal...`,
          totalVehicles: vehicles.length,
          processedVehicles: savedCount + i,
          errors: []
        });
      }

      const vehiclesData = batch.map(vehicle => {
        const descriptionParts = vehicle.DescricaoModelo.split(' ');
        const brand = descriptionParts[0] || 'Não informado';
        const model = descriptionParts.slice(1).join(' ') || 'Não informado';

        return {
          brand: brand,
          model: model,
          year: parseInt(vehicle.AnoFabricacaoModelo) || new Date().getFullYear(),
          value: vehicle.ValorCompra || 0,
          is_used: true,
          plate_number: vehicle.Placa,
          color: vehicle.Cor || null,
          odometer: vehicle.OdometroAtual || 0,
          fuel_type: vehicle.TipoCombustivel || null,
          group_id: vehicle.LetraGrupo || 'A'
        };
      });

      const { error: vehiclesError } = await supabase
        .from('vehicles')
        .upsert(vehiclesData, { 
          onConflict: 'plate_number',
          ignoreDuplicates: false 
        });

      if (vehiclesError) {
        console.error(`❌ Erro ao salvar lote ${Math.floor(i / batchSize) + 1} na tabela vehicles:`, vehiclesError);
        errors.push(`Erro no lote ${Math.floor(i / batchSize) + 1} (vehicles): ${vehiclesError.message}`);
      }
    }

    console.log(`✅ Sincronização completa: ${savedCount} veículos salvos`);
    
    return { success: true, savedCount, errors };
    
  } catch (error) {
    console.error('❌ Erro inesperado ao salvar veículos no cache:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    errors.push(errorMessage);
    
    return { success: false, savedCount, errors };
  }
};

// Função principal de sincronização completa
export const syncAllVehicles = async (
  onProgress?: (status: SyncStatus) => void
): Promise<{ success: boolean; message: string; vehicleCount: number; errors: string[] }> => {
  const startTime = Date.now();
  
  try {
    // Buscar todos os veículos da Locavia
    const { success: fetchSuccess, vehicles, errors: fetchErrors } = await getAllVehiclesFromLocavia(onProgress);
    
    if (!fetchSuccess || vehicles.length === 0) {
      return {
        success: false,
        message: 'Falha ao buscar veículos da Locavia',
        vehicleCount: 0,
        errors: fetchErrors
      };
    }

    // Salvar todos os veículos no cache
    const { success: saveSuccess, savedCount, errors: saveErrors } = await saveAllVehiclesToCache(vehicles, onProgress);
    
    const allErrors = [...fetchErrors, ...saveErrors];
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    if (onProgress) {
      onProgress({
        isRunning: false,
        progress: 100,
        currentTask: `Sincronização concluída em ${duration}s`,
        totalVehicles: vehicles.length,
        processedVehicles: savedCount,
        errors: allErrors,
        lastSync: new Date()
      });
    }

    return {
      success: saveSuccess,
      message: `Sincronização concluída: ${savedCount} veículos salvos em ${duration}s`,
      vehicleCount: savedCount,
      errors: allErrors
    };
    
  } catch (error) {
    console.error('❌ Erro na sincronização completa:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (onProgress) {
      onProgress({
        isRunning: false,
        progress: 0,
        currentTask: 'Erro na sincronização',
        totalVehicles: 0,
        processedVehicles: 0,
        errors: [errorMessage]
      });
    }

    return {
      success: false,
      message: `Erro na sincronização: ${errorMessage}`,
      vehicleCount: 0,
      errors: [errorMessage]
    };
  }
};

// Função para verificar o status da última sincronização
export const getLastSyncStatus = async (): Promise<{ lastSync: Date | null; vehicleCount: number }> => {
  try {
    const { data, error } = await supabase
      .from('locavia_vehicles_cache')
      .select('cached_at')
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar última sincronização:', error);
      return { lastSync: null, vehicleCount: 0 };
    }

    const { count } = await supabase
      .from('locavia_vehicles_cache')
      .select('*', { count: 'exact', head: true });

    return {
      lastSync: data?.cached_at ? new Date(data.cached_at) : null,
      vehicleCount: count || 0
    };
  } catch (error) {
    console.error('Erro ao verificar status da sincronização:', error);
    return { lastSync: null, vehicleCount: 0 };
  }
};
