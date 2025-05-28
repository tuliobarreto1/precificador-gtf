
// Mock data for clients
export interface Client {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  email: string;
}

export interface CustomClient {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  email: string;
}

export const clients: Client[] = [
  { id: '1', name: 'João da Silva', document: '123.456.789-00', type: 'PF', email: 'joao@email.com' },
  { id: '2', name: 'Maria Souza', document: '987.654.321-00', type: 'PF', email: 'maria@email.com' },
  { id: '3', name: 'Empresa ABC Ltda', document: '12.345.678/0001-90', type: 'PJ', email: 'abc@email.com' },
];

// Mock data for vehicles
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plateNumber?: string;
  value: number;
  groupId: string;
}

export const vehicles: Vehicle[] = [
  { id: '1', brand: 'Fiat', model: 'Uno', value: 45000, groupId: '1' },
  { id: '2', brand: 'Volkswagen', model: 'Gol', value: 50000, groupId: '1' },
  { id: '3', brand: 'Toyota', model: 'Corolla', value: 90000, groupId: '2' },
  { id: '4', brand: 'Honda', model: 'Civic', value: 85000, groupId: '2' },
  { id: '5', brand: 'Mercedes-Benz', model: 'C180', value: 150000, groupId: '3' },
  { id: '6', brand: 'BMW', model: '320i', value: 160000, groupId: '3' },
];

// Mock data for vehicle groups
export interface VehicleGroup {
  id: string;
  name: string;
  depreciationRate: number;
  maintenanceCost: number;
}

export const vehicleGroups: VehicleGroup[] = [
  { id: '1', name: 'Grupo A', depreciationRate: 0.01, maintenanceCost: 300 },
  { id: '2', name: 'Grupo B', depreciationRate: 0.015, maintenanceCost: 450 },
  { id: '3', name: 'Grupo C', depreciationRate: 0.02, maintenanceCost: 600 },
];

// Mock data for quotes
export interface Quote {
  id: string;
  client: Client;
  vehicle: Vehicle;
  contractMonths: number;
  monthlyKm: number;
  totalCost: number;
  createdAt: string;
}

export const quotes: Quote[] = [
  { id: '1', client: clients[0], vehicle: vehicles[0], contractMonths: 24, monthlyKm: 3000, totalCost: 1500, createdAt: '2023-01-01' },
  { id: '2', client: clients[1], vehicle: vehicles[1], contractMonths: 36, monthlyKm: 2500, totalCost: 1800, createdAt: '2023-02-15' },
  { id: '3', client: clients[2], vehicle: vehicles[2], contractMonths: 48, monthlyKm: 2000, totalCost: 2500, createdAt: '2023-03-20' },
];

// Importar o cliente Supabase do arquivo que agora exporta corretamente
import { supabase } from '@/integrations/supabase/client';

// Função para simular API calls
export const getClients = (): Client[] => {
  return clients;
};

export const getClientById = (id: string): Client | undefined => {
  return clients.find(client => client.id === id);
};

export const getVehicles = (): Vehicle[] => {
  return vehicles;
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehicles.find(vehicle => vehicle.id === id);
};

export const getVehicleGroups = (): VehicleGroup[] => {
  return vehicleGroups;
};

export const getVehicleGroupById = (id: string): VehicleGroup | undefined => {
  return vehicleGroups.find(group => group.id === id);
};

// Função para buscar orçamentos (integrando com Supabase)
export const fetchQuotesFromSupabase = async () => {
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
      console.error('Erro ao buscar orçamentos:', error);
      return { success: false, error, quotes: [] };
    }
    
    return { success: true, quotes: data || [] };
  } catch (error) {
    console.error('Erro inesperado ao buscar orçamentos:', error);
    return { success: false, error, quotes: [] };
  }
};

// Interface para os retornos das funções de autenticação
interface AuthResponse {
  success: boolean;
  user?: any;
  error?: any;
}

// Função de login para autenticação via Supabase Auth (não usado no sistema atual)
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, error };
  }
}

// Função de registro para autenticação (não usado no sistema atual)
export async function signUp(email: string, password: string, name: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    
    if (error) {
      console.error('Erro ao criar conta:', error);
      return { success: false, error };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return { success: false, error };
  }
}

// Função para obter o perfil do usuário atual (não usado no sistema atual)
export async function getCurrentProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      console.log('Nenhuma sessão de usuário encontrada');
      return { success: false, profile: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return { success: false, error, profile: null };
    }
    
    if (!data) {
      console.log('Perfil não encontrado, pode ser necessário criar');
      return { success: false, profile: null };
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return { success: false, error, profile: null };
  }
}

// Função principal de autenticação usando a tabela system_users
export async function signInAdmin(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('🔐 Tentando login admin para:', email);
    
    const { data, error } = await supabase
      .from('system_users')
      .select('id, name, email, password, role, status')
      .eq('email', email)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      console.error('❌ Usuário não encontrado ou inativo:', error);
      return { success: false, error: { message: 'Usuário não encontrado ou inativo' } };
    }
    
    console.log('👤 Usuário encontrado:', { id: data.id, name: data.name, email: data.email, role: data.role });
    console.log('🔑 Senha fornecida:', password);
    console.log('🔑 Senha no banco:', data.password);
    
    // Comparar senhas
    if (data.password !== password.trim()) {
      console.error('❌ Senha incorreta');
      return { success: false, error: { message: 'Credenciais inválidas' } };
    }
    
    console.log('✅ Senha correta, criando sessão...');
    
    // Criar objeto do usuário para o localStorage
    const adminUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role
    };
    
    // Armazenar no localStorage
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    
    // Atualizar último login
    try {
      await supabase
        .from('system_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
      
      console.log('📅 Último login atualizado');
    } catch (updateError) {
      console.warn('⚠️ Erro ao atualizar último login:', updateError);
    }
    
    console.log('✅ Login admin realizado com sucesso');
    return { 
      success: true, 
      user: adminUser
    };
  } catch (error) {
    console.error('💥 Erro na autenticação de admin:', error);
    return { success: false, error };
  }
}

// Função para verificar se o usuário admin está logado
export function getAdminUser() {
  try {
    const adminUserStr = localStorage.getItem('admin_user');
    if (!adminUserStr) {
      console.log('❌ Nenhum usuário admin no localStorage');
      return null;
    }
    
    const adminUser = JSON.parse(adminUserStr);
    console.log('✅ Usuário admin encontrado no localStorage:', adminUser);
    return adminUser;
  } catch (error) {
    console.error('💥 Erro ao obter usuário admin:', error);
    return null;
  }
}

// Função para logout do usuário admin
export async function signOutAdmin(): Promise<{ success: boolean }> {
  try {
    console.log('🚪 Fazendo logout do usuário admin...');
    localStorage.removeItem('admin_user');
    console.log('✅ Logout realizado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('💥 Erro ao fazer logout de admin:', error);
    return { success: false };
  }
}
