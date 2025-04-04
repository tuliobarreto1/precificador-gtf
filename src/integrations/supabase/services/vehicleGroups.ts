
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
  ipvaCost?: number;          // Novos campos
  licensingCost?: number;
}

// Função para buscar grupos de veículos
export async function getVehicleGroups() {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Erro ao buscar grupos de veículos:', error);
      return { success: false, error, groups: [] };
    }
    
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
    
    return { success: true, groups };
  } catch (error) {
    console.error('Erro inesperado ao buscar grupos de veículos:', error);
    
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
        ipvaCost: 0,
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
        ipvaCost: 0,
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
        ipvaCost: 0,
        licensingCost: 0
      }
    ];
    
    return { success: false, error, groups: defaultGroups };
  }
}

// Função para obter um grupo de veículo pelo ID
export async function getVehicleGroupById(id: string): Promise<VehicleGroup | null> {
  try {
    if (!id) {
      return null;
    }

    // Verificar se o ID é uma chave primária UUID ou um código
    let query = supabase.from('vehicle_groups');
    
    // Tenta buscar pelo id primeiro
    let { data, error } = await query.select('*').eq('id', id).maybeSingle();
    
    // Se não encontrar, tenta buscar pelo código
    if (!data && !error) {
      ({ data, error } = await query.select('*').eq('code', id).maybeSingle());
    }
    
    if (error) {
      console.error('Erro ao buscar grupo de veículo:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
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
    return null;
  }
}

