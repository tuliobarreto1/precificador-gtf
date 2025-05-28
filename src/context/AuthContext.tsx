
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getAdminUser, signOutAdmin } from '@/lib/api';

// Tipo para usuários administradores
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'user';
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  adminUser: AdminUser | null;
  profile: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
  switchUser: (userEmail: string, password: string) => Promise<boolean>;
  availableUsers: AdminUser[];
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<AdminUser[]>([]);

  // Função para buscar usuários disponíveis
  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('id, name, email, role')
        .eq('status', 'active')
        .order('name');
      
      if (!error && data) {
        const users = data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as 'admin' | 'supervisor' | 'user'
        }));
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error);
    }
  };

  // Função para verificar usuário admin
  const checkAdminUser = () => {
    const admin = getAdminUser();
    console.log('🔍 Verificando usuário admin:', admin);
    setAdminUser(admin);
    return admin;
  };

  // Função para trocar usuário
  const switchUser = async (userEmail: string, password: string): Promise<boolean> => {
    try {
      console.log('🔄 Tentando trocar para usuário:', userEmail);
      
      // Buscar o usuário na base de dados
      const { data, error } = await supabase
        .from('system_users')
        .select('id, name, email, password, role, status')
        .eq('email', userEmail)
        .eq('status', 'active')
        .single();
      
      if (error || !data) {
        console.error('❌ Usuário não encontrado:', error);
        return false;
      }
      
      // Verificar senha
      if (data.password !== password.trim()) {
        console.error('❌ Senha incorreta para troca de usuário');
        return false;
      }
      
      // Fazer logout do usuário atual
      localStorage.removeItem('admin_user');
      
      // Fazer login com o novo usuário
      const newUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role
      };
      
      localStorage.setItem('admin_user', JSON.stringify(newUser));
      setAdminUser(newUser);
      
      // Atualizar último login
      await supabase
        .from('system_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
      
      console.log('✅ Troca de usuário realizada com sucesso:', newUser);
      return true;
    } catch (error) {
      console.error('💥 Erro na troca de usuário:', error);
      return false;
    }
  };

  // Função para forçar atualização do estado de autenticação
  const refreshAuth = () => {
    console.log('🔄 Forçando atualização do estado de autenticação...');
    const admin = checkAdminUser();
    if (admin) {
      console.log('✅ Usuário admin encontrado, definindo como autenticado');
      setIsLoading(false);
    } else {
      console.log('❌ Nenhum usuário admin encontrado');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Inicializando AuthProvider...');
    
    // Verificar se há um usuário admin logado
    const admin = checkAdminUser();
    if (admin) {
      console.log('✅ Usuário admin encontrado na inicialização:', admin);
      setIsLoading(false);
    } else {
      console.log('❌ Nenhum usuário admin encontrado na inicialização');
      setIsLoading(false);
    }
    
    // Buscar usuários disponíveis
    fetchAvailableUsers();
  }, []);

  // Listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_user') {
        console.log('📦 Mudança detectada no localStorage para admin_user');
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar periodicamente se o usuário ainda está logado
    const checkAuth = setInterval(() => {
      const currentAdmin = getAdminUser();
      if (adminUser && !currentAdmin) {
        console.log('⚠️ Usuário admin removido, atualizando contexto...');
        setAdminUser(null);
      } else if (!adminUser && currentAdmin) {
        console.log('✅ Novo usuário admin encontrado, atualizando contexto...');
        setAdminUser(currentAdmin);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkAuth);
    };
  }, [adminUser]);

  const signOut = async () => {
    console.log('🚪 Iniciando processo de logout...');
    
    // Fazer logout do usuário admin
    if (adminUser) {
      console.log('🔓 Fazendo logout do usuário admin...');
      await signOutAdmin();
      setAdminUser(null);
    }
    
    // Fazer logout do usuário Supabase, se houver
    if (session) {
      console.log('🔓 Fazendo logout do usuário Supabase...');
      await supabase.auth.signOut();
    }
    
    console.log('✅ Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      adminUser, 
      profile, 
      isLoading, 
      signOut, 
      refreshAuth, 
      switchUser,
      availableUsers 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
