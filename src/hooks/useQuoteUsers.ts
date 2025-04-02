
import { useState, useEffect } from 'react';
import { User, SavedQuote, defaultUser, UserRole } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';

// Chave para armazenar o usuário atual no localStorage
const CURRENT_USER_KEY = 'currentUser';

export function useQuoteUsers() {
  const [user, setUser] = useState<User>(defaultUser);
  const [availableUsers, setAvailableUsers] = useState<User[]>([defaultUser]);

  // Buscar usuários do sistema do Supabase
  const fetchSystemUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        console.error('Erro ao buscar usuários do sistema:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const mappedUsers: User[] = data.map(u => ({
          id: typeof u.id === 'string' ? parseInt(u.id.replace(/-/g, '').substring(0, 8), 16) : 0,
          name: u.name,
          email: u.email,
          role: u.role as UserRole,
          status: u.status as 'active' | 'inactive',
          lastLogin: u.last_login || new Date().toISOString()
        }));
        
        setAvailableUsers(mappedUsers);
        
        // Se não houver usuário atual definido, usar o primeiro administrador ou o primeiro usuário disponível
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (!storedUser) {
          const adminUser = mappedUsers.find(u => u.role === 'admin') || mappedUsers[0];
          if (adminUser) {
            setUser(adminUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  // Carregar usuário do localStorage na inicialização e buscar usuários do sistema
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('Usuário carregado do localStorage:', parsedUser);
      }
      
      // Buscar usuários do sistema
      fetchSystemUsers();
    } catch (error) {
      console.error('Erro ao carregar usuário do localStorage:', error);
      // Em caso de erro, definir o usuário padrão
      setUser(defaultUser);
    }
  }, []);

  // Função para obter o usuário atual
  const getCurrentUser = (): User => {
    return user;
  };

  // Função para definir o usuário atual
  const setCurrentUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    console.log('Usuário atual alterado para:', newUser);
  };

  // Function to authenticate a user by ID
  const authenticateUser = (userId: number, password?: string): boolean => {
    const foundUser = availableUsers.find(u => u.id === userId && u.status === 'active');
    
    if (foundUser) {
      // Se a senha foi fornecida, verificar
      if (password !== undefined) {
        // Em um sistema real, isso seria uma verificação criptográfica adequada
        // Para fins de simulação, vamos aceitar qualquer senha não vazia para o usuário correspondente
        if (password.trim() === '') {
          console.log('Autenticação falhou: senha vazia');
          return false;
        }
        
        // Atualizar data de último login
        const updatedUser = {
          ...foundUser,
          lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        
        setCurrentUser(updatedUser);
        console.log(`Usuário ${updatedUser.name} autenticado com senha`);
        return true;
      } else {
        // Para compatibilidade com o código existente, permitir autenticação sem senha
        // (isso será usado apenas em fluxos internos do sistema)
        setCurrentUser(foundUser);
        console.log(`Usuário ${foundUser.name} autenticado sem senha (fluxo interno)`);
        return true;
      }
    }
    
    console.log('Autenticação falhou: usuário não encontrado ou inativo');
    return false;
  };

  // Verificar se um usuário pode editar um orçamento
  const canEditQuote = (quote: SavedQuote): boolean => {
    const currentUser = getCurrentUser();
    console.log('Verificando permissão de edição:', {
      usuario: currentUser,
      criador: quote.createdBy,
      permissao: (quote.createdBy?.id === currentUser.id || 
                currentUser.role === 'manager' || 
                currentUser.role === 'admin')
    });
    
    // Se não houver informações sobre quem criou, verificar se o usuário atual tem permissões elevadas
    if (!quote.createdBy) {
      return currentUser.role === 'manager' || currentUser.role === 'admin';
    }
    
    // Caso contrário, verificar se o usuário atual é o criador ou tem permissões elevadas
    return quote.createdBy.id === currentUser.id || 
           currentUser.role === 'manager' || 
           currentUser.role === 'admin';
  };

  // Verificar se um usuário pode excluir um orçamento
  const canDeleteQuote = (quote: SavedQuote): boolean => {
    const currentUser = getCurrentUser();
    console.log('Verificando permissão de exclusão:', {
      usuario: currentUser,
      criador: quote.createdBy,
      permissao: (quote.createdBy?.id === currentUser.id || 
                currentUser.role === 'manager' || 
                currentUser.role === 'admin')
    });
    
    // Se não houver informações sobre quem criou, verificar se o usuário atual tem permissões elevadas
    if (!quote.createdBy) {
      return currentUser.role === 'manager' || currentUser.role === 'admin';
    }
    
    // Caso contrário, verificar se o usuário atual é o criador ou tem permissões elevadas
    return quote.createdBy.id === currentUser.id || 
           currentUser.role === 'manager' || 
           currentUser.role === 'admin';
  };

  return {
    user,
    getCurrentUser,
    setCurrentUser,
    availableUsers,
    authenticateUser,
    canEditQuote,
    canDeleteQuote
  };
}
