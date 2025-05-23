
import { supabase } from '../client';

// Interface para grupo de veículo
export interface VehicleGroup {
  id: string;
  name: string;
  revisionKm: number;
  tireKm: number;
  revisionCost: number;
  tireCost: number;
  description?: string;
  code?: string;
  ipvaCost?: number;          // Percentual (ex: 0.024 = 2.4%)
  licensingCost?: number;
}

// Função para buscar grupos de veículos com logs detalhados
export async function getVehicleGroups() {
  try {
    console.log('Iniciando busca por grupos de veículos no Supabase...');
    
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar grupos de veículos do Supabase:', error);
      return { success: false, error, groups: [] };
    }
    
    console.log('Dados brutos recebidos do Supabase:', data);
    
    // Converter dados do Supabase para o formato esperado pela aplicação
    const groups = data.map(group => ({
      id: group.id,
      name: group.name || `Grupo ${group.code}`,
      revisionKm: group.revision_km || 10000,
      tireKm: group.tire_km || 40000,
      revisionCost: group.revision_cost || 300,
      tireCost: group.tire_cost || 1200,
      description: group.description,
      code: group.code,
      ipvaCost: group.ipva_cost || 0,
      licensingCost: group.licensing_cost || 0
    }));
    
    console.log('Grupos de veículos mapeados:', groups);
    return { success: true, groups };
  } catch (error) {
    console.error('Erro inesperado ao buscar grupos de veículos:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
    
    // Fornecer dados padrão em caso de erro
    const defaultGroups = [
      {
        id: 'A',
        name: 'Grupo A',
        revisionKm: 10000,
        tireKm: 40000,
        revisionCost: 300,
        tireCost: 1200,
        description: 'Veículos de pequeno porte',
        ipvaCost: 0.03, // 3% como padrão
        licensingCost: 0
      },
      {
        id: 'B',
        name: 'Grupo B',
        revisionKm: 15000,
        tireKm: 45000,
        revisionCost: 350,
        tireCost: 1400,
        description: 'Veículos de médio porte',
        ipvaCost: 0.03, // 3% como padrão
        licensingCost: 0
      },
      {
        id: 'C',
        name: 'Grupo C',
        revisionKm: 20000,
        tireKm: 50000,
        revisionCost: 400,
        tireCost: 1600,
        description: 'Veículos de grande porte',
        ipvaCost: 0.03, // 3% como padrão
        licensingCost: 0
      }
    ];
    
    return { success: false, error, groups: defaultGroups };
  }
}

// Função para obter um grupo de veículo pelo ID com logs detalhados
export async function getVehicleGroupById(id: string): Promise<VehicleGroup | null> {
  try {
    console.log(`Buscando grupo de veículo com ID: ${id}`);
    
    if (!id) {
      console.log('ID não fornecido, retornando null');
      return null;
    }

    // Verificar se o ID é uma chave primária UUID ou um código
    let query = supabase.from('vehicle_groups');
    
    // Tenta buscar pelo id primeiro
    console.log(`Tentando buscar grupo por ID: ${id}`);
    let { data, error } = await query.select('*').eq('id', id).maybeSingle();
    
    // Se não encontrar, tenta buscar pelo código
    if (!data && !error) {
      console.log(`Grupo não encontrado por ID, tentando buscar por código: ${id}`);
      ({ data, error } = await query.select('*').eq('code', id).maybeSingle());
    }
    
    if (error) {
      console.error('Erro ao buscar grupo de veículo:', error);
      return null;
    }
    
    if (!data) {
      console.log(`Nenhum grupo encontrado com ID ou código: ${id}`);
      return null;
    }
    
    console.log('Grupo encontrado:', data);
    
    return {
      id: data.id,
      name: data.name || `Grupo ${data.code}`,
      revisionKm: data.revision_km || 10000,
      tireKm: data.tire_km || 40000,
      revisionCost: data.revision_cost || 300,
      tireCost: data.tire_cost || 1200,
      description: data.description,
      code: data.code,
      ipvaCost: data.ipva_cost || 0,
      licensingCost: data.licensing_cost || 0
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar grupo de veículo:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
    return null;
  }
}
