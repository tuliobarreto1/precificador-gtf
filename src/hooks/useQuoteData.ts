
import { getClientById, getVehicleById, getVehicleGroupById } from '@/lib/data-provider';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { QuoteVehicleItem, SavedQuote } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';

export function useQuoteData() {
  // Função para recuperar um cliente pelo ID
  const getClient = async (id: string): Promise<Client | null> => {
    if (!id) return null;
    
    try {
      // Buscar cliente do Supabase
      const client = await getClientById(id);
      return client;
    } catch (error) {
      console.error(`Erro ao buscar cliente ${id}:`, error);
      // Retornar null se não encontrado
      return null;
    }
  };

  // Função para recuperar um veículo pelo ID
  const getVehicle = async (id: string): Promise<Vehicle | null> => {
    if (!id) return null;
    
    try {
      // Buscar veículo do Supabase
      const vehicle = await getVehicleById(id);
      return vehicle;
    } catch (error) {
      console.error(`Erro ao buscar veículo ${id}:`, error);
      // Retornar null se não encontrado
      return null;
    }
  };

  // Função para carregar dados de um orçamento usando seu ID
  const loadQuoteData = async (quoteId: string, setQuoteForm: any) => {
    try {
      // Buscar o orçamento pelo ID
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', quoteId)
        .single();
        
      if (error || !quoteData) {
        console.error('Erro ao carregar orçamento do Supabase:', error);
        return false;
      }
      
      // Buscar os veículos associados ao orçamento
      const { data: quoteVehicles, error: vehiclesError } = await supabase
        .from('quote_vehicles')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('quote_id', quoteId);
        
      if (vehiclesError || !quoteVehicles) {
        console.error('Erro ao carregar veículos do orçamento:', vehiclesError);
        return false;
      }
      
      // Converter o cliente do formato do Supabase
      let client: Client;
      if (quoteData.client) {
        client = {
          id: quoteData.client.id,
          name: quoteData.client.name,
          type: (quoteData.client.document?.length === 14 ? 'PJ' : 'PF'),
          document: quoteData.client.document || '',
          email: quoteData.client.email,
          contact: quoteData.client.phone,
          responsible: quoteData.client.responsible_person
        };
      } else {
        const fetchedClient = await getClient(quoteData.client_id);
        if (fetchedClient) {
          client = fetchedClient;
        } else {
          // Cliente padrão se não encontrado
          client = {
            id: quoteData.client_id || '',
            name: 'Cliente não encontrado',
            type: 'PJ',
            document: ''
          };
        }
      }
      
      // Converter os veículos do formato do Supabase
      const vehicleItems: QuoteVehicleItem[] = [];
      
      for (const qv of quoteVehicles) {
        let vehicle: Vehicle;
        if (qv.vehicle) {
          vehicle = {
            id: qv.vehicle.id,
            brand: qv.vehicle.brand,
            model: qv.vehicle.model,
            year: qv.vehicle.year,
            value: qv.vehicle.value,
            isUsed: qv.vehicle.is_used,
            plateNumber: qv.vehicle.plate_number,
            groupId: qv.vehicle.group_id
          };
        } else {
          const fetchedVehicle = await getVehicle(qv.vehicle_id);
          if (fetchedVehicle) {
            vehicle = fetchedVehicle;
          } else {
            // Veículo padrão se não encontrado
            vehicle = {
              id: qv.vehicle_id || '',
              brand: 'Veículo não encontrado',
              model: '',
              year: new Date().getFullYear(),
              value: 0,
              isUsed: false,
              groupId: 'A'
            };
          }
        }
        
        const fetchedVehicleGroup = await getVehicleGroupById(vehicle.groupId);
        const vehicleGroup: VehicleGroup = fetchedVehicleGroup || {
          id: vehicle.groupId || 'A',
          name: `Grupo ${vehicle.groupId || 'A'}`,
          description: '',
          revisionKm: 10000,
          revisionCost: 300,
          tireKm: 40000,
          tireCost: 1200
        };
        
        vehicleItems.push({
          vehicle,
          vehicleGroup,
          params: {
            contractMonths: qv.contract_months,
            monthlyKm: qv.monthly_km,
            operationSeverity: qv.operation_severity as 1|2|3|4|5|6,
            hasTracking: qv.has_tracking
          }
        });
      }
      
      // Configurar o formulário com os dados carregados
      setQuoteForm({
        client,
        vehicles: vehicleItems,
        useGlobalParams: vehicleItems.length <= 1, // Usar parâmetros globais se tiver apenas 1 veículo
        globalParams: {
          contractMonths: quoteData.contract_months || 24,
          monthlyKm: quoteData.monthly_km || 3000,
          operationSeverity: (quoteData.operation_severity || 3) as 1|2|3|4|5|6,
          hasTracking: quoteData.has_tracking || false
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados do orçamento:', error);
      return false;
    }
  };
  
  // Função para carregar dados de veículo completo quando necessário
  const loadFullVehicleData = async (savedQuote: SavedQuote) => {
    try {
      // Criar um array para armazenar as promessas de busca de veículos
      const vehiclePromises = savedQuote.vehicles.map(async (savedVehicle) => {
        // Tentar buscar o veículo primeiro no banco de dados
        const { data, error } = await supabase
          .from('vehicles')
          .select('*, group:vehicle_groups(*)')
          .eq('id', savedVehicle.vehicleId)
          .maybeSingle();
          
        if (error || !data) {
          // Se não encontrou no banco, criar um veículo básico com as informações salvas
          return {
            vehicle: {
              id: savedVehicle.vehicleId,
              brand: savedVehicle.vehicleBrand,
              model: savedVehicle.vehicleModel,
              year: new Date().getFullYear(),
              value: 0,
              isUsed: !!savedVehicle.plateNumber,
              plateNumber: savedVehicle.plateNumber,
              groupId: savedVehicle.groupId
            },
            group: {
              id: savedVehicle.groupId || 'A',
              name: `Grupo ${savedVehicle.groupId || 'A'}`,
              description: '',
              revisionKm: 10000,
              revisionCost: 300,
              tireKm: 40000,
              tireCost: 1200
            }
          };
        }
        
        // Se encontrou no banco, mapear para o formato Vehicle
        let vehicleGroup: VehicleGroup;
        
        // Verifica se data.group é um objeto válido ou se precisamos buscar o grupo pelo ID
        // Corrigindo o acesso a 'data.group' para garantir que ele não seja null
        if (data.group && typeof data.group === 'object') {
          // Acessando com segurança as propriedades de data.group
          const group = data.group as Record<string, any>;
          vehicleGroup = {
            id: group.id || group.code || data.group_id || '',
            name: group.name || `Grupo ${group.code || data.group_id || ''}`,
            description: group.description || '',
            revisionKm: group.revision_km || 10000,
            revisionCost: group.revision_cost || 300,
            tireKm: group.tire_km || 40000,
            tireCost: group.tire_cost || 1200
          };
        } else {
          // Se não tem grupo na resposta, buscar pelo ID
          const fetchedGroup = await getVehicleGroupById(data.group_id);
          vehicleGroup = fetchedGroup || {
            id: data.group_id || 'A',
            name: `Grupo ${data.group_id || 'A'}`,
            description: '',
            revisionKm: 10000,
            revisionCost: 300,
            tireKm: 40000,
            tireCost: 1200
          };
        }
        
        return {
          vehicle: {
            id: data.id,
            brand: data.brand,
            model: data.model,
            year: data.year,
            value: data.value,
            isUsed: data.is_used,
            plateNumber: data.plate_number,
            color: data.color,
            odometer: data.odometer,
            groupId: data.group_id
          },
          group: vehicleGroup
        };
      });
      
      // Aguardar todas as promessas serem resolvidas
      const vehicleResults = await Promise.all(vehiclePromises);
      
      // Montar o resultado final
      return vehicleResults;
    } catch (error) {
      console.error('Erro ao carregar dados completos dos veículos:', error);
      return [];
    }
  };
  
  return {
    getClient,
    getVehicle,
    loadQuoteData,
    loadFullVehicleData
  };
}
