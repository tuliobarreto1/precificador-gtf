import { supabase } from '@/integrations/supabase/client';

export const getCurrentProfile = async () => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return { success: false, error: 'Erro ao buscar perfil' };
  }
};

export const updateProfile = async (updates: { username: string; full_name: string; avatar_url: string }) => {
  try {
    const { data, error } = await supabase.from('profiles').update(updates).select();
    
    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: 'Erro ao atualizar perfil' };
  }
};

export const getVehicles = async () => {
  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*');

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return { success: false, error: error.message };
    }

    return { success: true, vehicles };
  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    return { success: false, error: 'Erro ao buscar veículos' };
  }
};

export const signInAdmin = async (email: string, password: string) => {
  try {
    console.log('Tentando login admin para:', email);
    
    // Verificar conectividade primeiro
    const connectivityCheck = await fetch('https://lklccqyojapgmqeeazld.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbGNjcXlvamFwZ21xZWVhemxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkyNTk4NjMsImV4cCI6MjAwNDgzNTg2M30.-1jtHRgT0yQ3DEwJPsywJJim5KEDdM7CIdTLybZjXxk'
      }
    }).catch(() => null);
    
    if (!connectivityCheck) {
      console.log('Sem conectividade com Supabase');
      return { success: false, message: 'Sem conectividade com o servidor' };
    }
    
    // Buscar usuário na tabela system_users
    const { data: userData, error: userError } = await supabase
      .from('system_users')
      .select('id, name, email, password, role, status')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return { success: false, message: 'Erro ao verificar credenciais' };
    }

    if (!userData) {
      console.log('Usuário não encontrado na tabela system_users');
      return { success: false, message: 'Usuário não encontrado' };
    }

    // Verificar senha (em produção, use hash adequado)
    if (userData.password !== password) {
      console.log('Senha incorreta para usuário:', email);
      return { success: false, message: 'Senha incorreta' };
    }

    // Criar objeto de usuário para armazenar localmente
    const adminUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };

    // Armazenar no localStorage
    localStorage.setItem('adminUser', JSON.stringify(adminUser));
    localStorage.setItem('currentUser', JSON.stringify(adminUser));
    
    console.log('Login admin bem-sucedido:', adminUser);
    return { success: true, user: adminUser };

  } catch (error) {
    console.error('Erro no signInAdmin:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Tentando login Supabase auth para:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login Supabase:', error);
      return { success: false, message: error.message };
    }

    if (data.user) {
      console.log('Login Supabase bem-sucedido:', data.user.id);
      return { success: true, user: data.user };
    }

    return { success: false, message: 'Falha na autenticação' };
  } catch (error) {
    console.error('Erro no signIn:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

export const getAdminUser = () => {
  try {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Erro ao obter usuário admin:', error);
    return null;
  }
};

export const signOutAdmin = async () => {
  try {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('currentUser');
    console.log('Logout admin realizado');
  } catch (error) {
    console.error('Erro no logout admin:', error);
  }
};
