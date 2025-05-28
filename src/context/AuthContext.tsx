
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
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para verificar usuário admin
  const checkAdminUser = () => {
    const admin = getAdminUser();
    console.log('🔍 Verificando usuário admin:', admin);
    setAdminUser(admin);
    return admin;
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
      return;
    }
    
    console.log('❌ Nenhum usuário admin encontrado na inicialização');
    setIsLoading(false);
  }, []);

  // Listener para mudanças no localStorage (para detectar login/logout admin)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_user') {
        console.log('📦 Mudança detectada no localStorage para admin_user');
        refreshAuth();
      }
    };

    // Listener para mudanças entre abas
    window.addEventListener('storage', handleStorageChange);
    
    // Listener para mudanças na mesma aba
    const handleLocalStorageChange = () => {
      console.log('📦 Mudança local detectada no localStorage');
      refreshAuth();
    };
    
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
    <AuthContext.Provider value={{ session, user, adminUser, profile, isLoading, signOut, refreshAuth }}>
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
