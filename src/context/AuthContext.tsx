
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentProfile, getAdminUser, signOutAdmin } from '@/lib/api';

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
  adminUser: AdminUser | null;  // Adicionando usuário admin
  profile: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);  // Estado para usuário admin
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Inicializando AuthProvider...');
    
    // Verificar se há um usuário admin logado
    const checkAdminUser = () => {
      const admin = getAdminUser();
      setAdminUser(admin);
      if (admin) {
        setIsLoading(false);
      }
    };
    
    checkAdminUser();
    
    // Configurar o listener de mudança de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Evento de autenticação:', event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Buscar o perfil do usuário, mas com setTimeout para evitar deadlock
          setTimeout(async () => {
            try {
              const { success, profile } = await getCurrentProfile();
              console.log('Perfil obtido:', success, profile);
              if (success && profile) {
                setProfile(profile);
              }
            } catch (error) {
              console.error('Erro ao buscar perfil:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          // Se não há usuário Supabase, verificar se há admin
          checkAdminUser();
          if (!adminUser) {
            setProfile(null);
            setIsLoading(false);
          }
        }
      }
    );

    // Verificar se já existe uma sessão Supabase
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Sessão atual:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        getCurrentProfile().then(({ success, profile }) => {
          console.log('Perfil obtido (inicial):', success, profile);
          if (success && profile) {
            setProfile(profile);
          }
          setIsLoading(false);
        }).catch(error => {
          console.error('Erro ao buscar perfil inicial:', error);
          setIsLoading(false);
        });
      } else {
        // Se não há usuário Supabase, só verificar admin
        if (!adminUser) {
          setIsLoading(false);
        }
      }
    }).catch(error => {
      console.error('Erro ao buscar sessão:', error);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Fazer logout do usuário admin, se houver
    if (adminUser) {
      await signOutAdmin();
      setAdminUser(null);
    }
    
    // Fazer logout do usuário Supabase, se houver
    if (session) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, adminUser, profile, isLoading, signOut }}>
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
