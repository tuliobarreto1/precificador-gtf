
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

// Tipos para as entidades
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  document?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  plate_number?: string;
  color?: string;
  odometer?: number;
  group_id?: string;
  is_used: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  title: string;
  client_id?: string;
  created_by?: string;
  contract_months: number;
  monthly_km: number;
  operation_severity: number;
  has_tracking: boolean;
  total_value: number;
  status: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  vehicle_id?: string;
  contract_months?: number;
  monthly_km?: number;
  operation_severity?: number;
  has_tracking?: boolean;
  monthly_value: number;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
}

// Funções para autenticação
export async function signUp(email: string, password: string, name: string) {
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

    if (error) throw error;
    
    if (data.user) {
      // Cria o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name,
          email,
          role: 'user'
        });
        
      if (profileError) throw profileError;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao criar conta:', error);
    toast({
      title: "Erro ao criar conta",
      description: error.message || "Ocorreu um erro ao criar sua conta.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    toast({
      title: "Erro ao fazer login",
      description: error.message || "Ocorreu um erro ao fazer login.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    toast({
      title: "Erro ao fazer logout",
      description: error.message || "Ocorreu um erro ao fazer logout.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return { success: false, error };
  }
}

export async function getCurrentProfile() {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (!user.user) return { success: false, error: 'Usuário não autenticado' };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
      
    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    console.error('Erro ao obter perfil atual:', error);
    return { success: false, error };
  }
}

// Funções para clientes
export async function getClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return { success: true, clients: data };
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    return { success: false, error };
  }
}

export async function getClientById(id: string) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return { success: true, client: data };
  } catch (error) {
    console.error(`Erro ao obter cliente ID ${id}:`, error);
    return { success: false, error };
  }
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        created_by: user.user?.id
      })
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Cliente criado",
      description: "Cliente criado com sucesso!",
    });
    
    return { success: true, client: data };
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    toast({
      title: "Erro ao criar cliente",
      description: error.message || "Ocorreu um erro ao criar o cliente.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function updateClient(id: string, client: Partial<Client>) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Cliente atualizado",
      description: "Cliente atualizado com sucesso!",
    });
    
    return { success: true, client: data };
  } catch (error: any) {
    console.error(`Erro ao atualizar cliente ID ${id}:`, error);
    toast({
      title: "Erro ao atualizar cliente",
      description: error.message || "Ocorreu um erro ao atualizar o cliente.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function deleteClient(id: string) {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast({
      title: "Cliente excluído",
      description: "Cliente excluído com sucesso!",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao excluir cliente ID ${id}:`, error);
    toast({
      title: "Erro ao excluir cliente",
      description: error.message || "Ocorreu um erro ao excluir o cliente.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

// Funções para grupos de veículos
export async function getVehicleGroups() {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return { success: true, groups: data };
  } catch (error) {
    console.error('Erro ao obter grupos de veículos:', error);
    return { success: false, error };
  }
}

export async function getVehicleGroupById(id: string) {
  try {
    const { data, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return { success: true, group: data };
  } catch (error) {
    console.error(`Erro ao obter grupo de veículo ID ${id}:`, error);
    return { success: false, error };
  }
}

// Funções para veículos
export async function getVehicles() {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_groups(id, name)')
      .order('brand')
      .order('model');
      
    if (error) throw error;
    return { success: true, vehicles: data };
  } catch (error) {
    console.error('Erro ao obter veículos:', error);
    return { success: false, error };
  }
}

export async function getVehicleById(id: string) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_groups(id, name)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return { success: true, vehicle: data };
  } catch (error) {
    console.error(`Erro ao obter veículo ID ${id}:`, error);
    return { success: false, error };
  }
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        ...vehicle,
        created_by: user.user?.id
      })
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Veículo criado",
      description: "Veículo criado com sucesso!",
    });
    
    return { success: true, vehicle: data };
  } catch (error: any) {
    console.error('Erro ao criar veículo:', error);
    toast({
      title: "Erro ao criar veículo",
      description: error.message || "Ocorreu um erro ao criar o veículo.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function updateVehicle(id: string, vehicle: Partial<Vehicle>) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Veículo atualizado",
      description: "Veículo atualizado com sucesso!",
    });
    
    return { success: true, vehicle: data };
  } catch (error: any) {
    console.error(`Erro ao atualizar veículo ID ${id}:`, error);
    toast({
      title: "Erro ao atualizar veículo",
      description: error.message || "Ocorreu um erro ao atualizar o veículo.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function deleteVehicle(id: string) {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast({
      title: "Veículo excluído",
      description: "Veículo excluído com sucesso!",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao excluir veículo ID ${id}:`, error);
    toast({
      title: "Erro ao excluir veículo",
      description: error.message || "Ocorreu um erro ao excluir o veículo.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

// Funções para orçamentos
export async function getQuotes() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients(id, name),
        items:quote_items(
          *,
          vehicle:vehicles(id, brand, model)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, quotes: data };
  } catch (error) {
    console.error('Erro ao obter orçamentos:', error);
    return { success: false, error };
  }
}

export async function getQuoteById(id: string) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients(id, name, email, document),
        items:quote_items(
          *,
          vehicle:vehicles(*, vehicle_groups(id, name))
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return { success: true, quote: data };
  } catch (error) {
    console.error(`Erro ao obter orçamento ID ${id}:`, error);
    return { success: false, error };
  }
}

export async function createQuote(
  quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>, 
  items: Omit<QuoteItem, 'id' | 'quote_id' | 'created_at' | 'updated_at'>[]
) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    // Inicia uma transação
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        ...quote,
        created_by: user.user?.id
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Insere os itens do orçamento
    if (items.length > 0) {
      const quoteItems = items.map(item => ({
        ...item,
        quote_id: data.id
      }));
      
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);
        
      if (itemsError) throw itemsError;
    }
    
    toast({
      title: "Orçamento criado",
      description: "Orçamento criado com sucesso!",
    });
    
    return { success: true, quote: data };
  } catch (error: any) {
    console.error('Erro ao criar orçamento:', error);
    toast({
      title: "Erro ao criar orçamento",
      description: error.message || "Ocorreu um erro ao criar o orçamento.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function updateQuote(
  id: string, 
  quote: Partial<Quote>, 
  items?: Omit<QuoteItem, 'id' | 'created_at' | 'updated_at'>[]
) {
  try {
    // Atualiza os dados do orçamento
    const { data, error } = await supabase
      .from('quotes')
      .update(quote)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Se recebeu itens para atualizar
    if (items) {
      // Primeiro remove os itens existentes
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', id);
        
      if (deleteError) throw deleteError;
      
      // Insere os novos itens
      if (items.length > 0) {
        const quoteItems = items.map(item => ({
          ...item,
          quote_id: id
        }));
        
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);
          
        if (itemsError) throw itemsError;
      }
    }
    
    toast({
      title: "Orçamento atualizado",
      description: "Orçamento atualizado com sucesso!",
    });
    
    return { success: true, quote: data };
  } catch (error: any) {
    console.error(`Erro ao atualizar orçamento ID ${id}:`, error);
    toast({
      title: "Erro ao atualizar orçamento",
      description: error.message || "Ocorreu um erro ao atualizar o orçamento.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}

export async function deleteQuote(id: string) {
  try {
    // Os itens do orçamento serão excluídos automaticamente devido à restrição ON DELETE CASCADE
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast({
      title: "Orçamento excluído",
      description: "Orçamento excluído com sucesso!",
    });
    
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao excluir orçamento ID ${id}:`, error);
    toast({
      title: "Erro ao excluir orçamento",
      description: error.message || "Ocorreu um erro ao excluir o orçamento.",
      variant: "destructive",
    });
    return { success: false, error };
  }
}
