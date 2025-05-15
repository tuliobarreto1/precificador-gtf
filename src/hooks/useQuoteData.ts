
import { getClientById, getVehicleById, getVehicleGroupById } from '@/lib/data-provider';
import { Client, Vehicle, VehicleGroup } from '@/lib/models';
import { QuoteVehicleItem, SavedQuote } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';

export function useQuoteData() {
  // Função para recuperar um cliente pelo ID
  const getClient = async (id: string): Promise<Client | null> => {
    if (!id) {
      console.error("ID do cliente não fornecido");
      return null;
    }
    
    try {
      console.log(`🔍 Buscando cliente com ID: ${id}`);
      // Buscar cliente do Supabase
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error(`Erro ao buscar cliente ${id}:`, error);
        return null;
      }
      
      if (!client) {
        console.warn(`Cliente com ID ${id} não encontrado`);
        return null;
      }
      
      // Mapear cliente do formato do banco para o formato da aplicação
      const mappedClient: Client = {
        id: client.id,
        name: client.name,
        type: client.document?.length === 11 ? 'PF' : 'PJ',
        document: client.document || '',
        email: client.email || '',
        contact: client.phone || '',
        responsible: client.responsible_person || ''
      };
      
      console.log(`✅ Cliente encontrado: ${mappedClient.name}`);
      return mappedClient;
    } catch (error) {
      console.error(`❌ Erro ao buscar cliente ${id}:`, error);
      return null;
    }
  };

  // Função para recuperar um veículo pelo ID
  const getVehicle = async (id: string): Promise<Vehicle | null> => {
    if (!id) {
      console.error("ID do veículo não fornecido");
      return null;
    }
    
    try {
      console.log(`🔍 Buscando veículo com ID: ${id}`);
      // Buscar veículo do Supabase
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error(`Erro ao buscar veículo ${id}:`, error);
        return null;
      }
      
      if (!vehicle) {
        console.warn(`Veículo com ID ${id} não encontrado`);
        return null;
      }
      
      // Mapear veículo do formato do banco para o formato da aplicação
      const mappedVehicle: Vehicle = {
        id: vehicle.id,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        value: vehicle.value || 0,
        isUsed: vehicle.is_used || false,
        plateNumber: vehicle.plate_number || '',
        groupId: vehicle.group_id || 'A'
      };
      
      console.log(`✅ Veículo encontrado: ${mappedVehicle.brand} ${mappedVehicle.model}`);
      return mappedVehicle;
    } catch (error) {
      console.error(`❌ Erro ao buscar veículo ${id}:`, error);
      return null;
    }
  };

  // Função para carregar dados de um orçamento usando seu ID
  const loadQuoteData = async (quoteId: string, setQuoteForm: any) => {
    try {
      console.log(`🔄 Carregando orçamento com ID: ${quoteId}`);
      
      // Buscar o orçamento pelo ID
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', quoteId)
        .maybeSingle();
        
      if (error || !quoteData) {
        console.error('❌ Erro ao carregar orçamento do Supabase:', error || "Orçamento não encontrado");
        return false;
      }
      
      console.log('✅ Dados básicos do orçamento carregados:', {
        id: quoteData.id,
        client_id: quoteData.client_id,
        client: quoteData.client?.name
      });
      
      // Buscar os veículos associados ao orçamento
      const { data: quoteVehicles, error: vehiclesError } = await supabase
        .from('quote_vehicles')
        .select(`
          *,
          vehicle:vehicle_id(*)
        `)
        .eq('quote_id', quoteId);
        
      if (vehiclesError || !quoteVehicles) {
        console.error('❌ Erro ao carregar veículos do orçamento:', vehiclesError || "Nenhum veículo encontrado");
        return false;
      }
      
      console.log(`✅ Veículos do orçamento carregados: ${quoteVehicles.length} veículos`);
      
      // Converter o cliente do formato do Supabase
      let client: Client;
      if (quoteData.client) {
        // Se o cliente foi incluído na resposta via JOIN
        client = {
          id: quoteData.client.id,
          name: quoteData.client.name,
          type: (quoteData.client.document?.length === 11 ? 'PF' : 'PJ'),
          document: quoteData.client.document || '',
          email: quoteData.client.email || '',
          contact: quoteData.client.phone || '',
          responsible: quoteData.client.responsible_person || ''
        };
      } else {
        // Se precisamos buscar o cliente separadamente
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
      
      // Log para rastrear o cliente
      console.log(`📋 Cliente do orçamento: ${client.name}`, client);
      
      // Converter os veículos do formato do Supabase
      const vehicleItems: QuoteVehicleItem[] = [];
      
      for (const qv of quoteVehicles) {
        let vehicle: Vehicle;
        if (qv.vehicle) {
          // Se o veículo foi incluído via JOIN
          vehicle = {
            id: qv.vehicle.id,
            brand: qv.vehicle.brand || '',
            model: qv.vehicle.model || '',
            year: qv.vehicle.year || new Date().getFullYear(),
            value: qv.vehicle.value || 0,
            isUsed: qv.vehicle.is_used || false,
            plateNumber: qv.vehicle.plate_number || '',
            groupId: qv.vehicle.group_id || 'A'
          };
        } else {
          // Se precisamos buscar o veículo separadamente
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
        
        // Buscar grupo do veículo
        const fetchedVehicleGroup = await getVehicleGroupById(vehicle.groupId || 'A');
        const vehicleGroup: VehicleGroup = fetchedVehicleGroup || {
          id: vehicle.groupId || 'A',
          name: `Grupo ${vehicle.groupId || 'A'}`,
          description: '',
          revisionKm: 10000,
          revisionCost: 300,
          tireKm: 40000,
          tireCost: 1200
        };
        
        // Adicionar veículo à lista
        vehicleItems.push({
          vehicle,
          vehicleGroup,
          params: {
            contractMonths: qv.contract_months || quoteData.contract_months || 24,
            monthlyKm: qv.monthly_km || quoteData.monthly_km || 3000,
            operationSeverity: (qv.operation_severity || quoteData.operation_severity || 3) as 1|2|3|4|5|6,
            hasTracking: qv.has_tracking ?? quoteData.has_tracking ?? false,
            protectionPlanId: qv.protection_plan_id || null,
            includeIpva: qv.include_ipva ?? quoteData.include_ipva ?? false,
            includeLicensing: qv.include_licensing ?? quoteData.include_licensing ?? false,
            includeTaxes: qv.include_taxes ?? quoteData.include_taxes ?? false
          }
        });
      }
      
      // Log para rastrear os veículos carregados
      console.log(`📋 Veículos do orçamento carregados:`, vehicleItems.map(vi => ({
        marca: vi.vehicle.brand,
        modelo: vi.vehicle.model,
        grupo: vi.vehicleGroup.name,
        params: vi.params
      })));
      
      // Configurar o formulário com os dados carregados
      const formData = {
        client,
        vehicles: vehicleItems,
        useGlobalParams: vehicleItems.length <= 1, // Usar parâmetros globais se tiver apenas 1 veículo
        globalParams: {
          contractMonths: quoteData.contract_months || 24,
          monthlyKm: quoteData.monthly_km || 3000,
          operationSeverity: (quoteData.operation_severity || 3) as 1|2|3|4|5|6,
          hasTracking: quoteData.has_tracking || false,
          protectionPlanId: quoteData.global_protection_plan_id || null,
          includeIpva: quoteData.include_ipva || false,
          includeLicensing: quoteData.include_licensing || false,
          includeTaxes: quoteData.include_taxes || false
        }
      };
      
      console.log(`✅ Formulário configurado com sucesso:`, {
        cliente: formData.client.name,
        veiculos: formData.vehicles.length,
        params: formData.globalParams
      });
      
      setQuoteForm(formData);
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar dados do orçamento:', error);
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
              groupId: savedVehicle.vehicleGroupId || savedVehicle.groupId || 'A'
            },
            group: {
              id: savedVehicle.vehicleGroupId || savedVehicle.groupId || 'A',
              name: `Grupo ${savedVehicle.vehicleGroupId || savedVehicle.groupId || 'A'}`,
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
