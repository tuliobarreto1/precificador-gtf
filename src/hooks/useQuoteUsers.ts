
import { useState, useEffect } from 'react';
import { SavedQuote, User, UserRole, defaultUser } from '@/context/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';

// Chave para armazenar o usuário atual no localStorage
const CURRENT_USER_KEY = 'currentUser';

export function useQuoteUsers() {
  const [user, setUser] = useState<User>(defaultUser);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar usuários do sistema do Supabase
  const fetchSystemUsers = async () => {
    try {
      console.log('Iniciando busca por usuários no Supabase...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar usuários do sistema:', error);
        setLoading(false);
        return [];
      }
      
      console.log('Dados retornados do Supabase:', data);
      
      if (data && data.length > 0) {
        const mappedUsers: User[] = data.map(u => ({
          id: u.id.toString(),
          name: u.name,
          email: u.email,
          role: u.role as UserRole,
          status: u.status as 'active' | 'inactive'
        }));
        
        console.log('Usuários mapeados:', mappedUsers);
        setAvailableUsers(mappedUsers);
        
        // Se não houver usuário atual definido, usar o primeiro administrador ou o primeiro usuário disponível
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (!storedUser) {
          const adminUser = mappedUsers.find(u => u.role === 'admin') || mappedUsers[0];
          if (adminUser) {
            setUser(adminUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
            console.log('Usuário padrão definido:', adminUser);
          }
        }
        
        setLoading(false);
        return mappedUsers;
      } else {
        console.warn('Nenhum usuário encontrado na tabela system_users');
        setAvailableUsers([]);
        setLoading(false);
        return [];
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar usuários:', error);
      setAvailableUsers([]);
      setLoading(false);
      return [];
    }
  };
  
  // Carregar cotações do Supabase
  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          client_id,
          status,
          status_flow,
          created_by,
          created_at,
          clients:client_id (name)
        `)
        .order('created_at', { ascending: false });
        
      if (error || !data) {
        console.error('Erro ao buscar cotações:', error);
        return;
      }
      
      // Mapear para SavedQuote
      const quotes: SavedQuote[] = data.map(quote => ({
        id: quote.id,
        clientId: quote.client_id,
        clientName: quote.clients?.name || 'Cliente não encontrado',
        vehicles: [],
        totalValue: 0,
        createdAt: new Date(quote.created_at),
        status: quote.status_flow || quote.status,
        createdBy: quote.created_by ? {
          id: quote.created_by.toString(),
          name: '',
          email: '',
          role: 'user',
        } : undefined
      }));
      
      setSavedQuotes(quotes);
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
    }
  };

  // Carregar usuário do localStorage na inicialização e buscar usuários do sistema
  useEffect(() => {
    const initializeData = async () => {
      console.log('Inicializando dados do useQuoteUsers...');
      
      try {
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('Usuário carregado do localStorage:', parsedUser);
        }
        
        // Buscar usuários do sistema
        await fetchSystemUsers();
        
        // Buscar cotações
        await fetchQuotes();
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setUser(defaultUser);
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Função para definir o usuário atual
  const setCurrentUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    console.log('Usuário atual alterado para:', newUser);
  };

  // Function to authenticate a user by ID
  const authenticateUser = (userId: string, password?: string): boolean => {
    const foundUser = availableUsers.find(u => u.id === userId && u.status === 'active');
    
    if (foundUser) {
      if (password !== undefined) {
        if (password.trim() === '') {
          console.log('Autenticação falhou: senha vazia');
          return false;
        }
        
        const updatedUser = {
          ...foundUser
        };
        
        setCurrentUser(updatedUser);
        console.log(`Usuário ${updatedUser.name} autenticado com senha`);
        return true;
      } else {
        setCurrentUser(foundUser);
        console.log(`Usuário ${foundUser.name} autenticado sem senha (fluxo interno)`);
        return true;
      }
    }
    
    console.log('Autenticação falhou: usuário não encontrado ou inativo');
    return false;
  };

  // Verificar se um usuário pode editar um orçamento
  const canEditQuote = (quoteId: string): boolean => {
    const quote = savedQuotes.find(q => q.id === quoteId);
    if (!quote) return false;
    
    const currentUser = user;
    
    if (!quote.createdBy) {
      return currentUser.role === 'manager' || 
             currentUser.role === 'admin';
    }
    
    return quote.createdBy.id === currentUser.id || 
           currentUser.role === 'manager' || 
           currentUser.role === 'admin';
  };

  // Verificar se um usuário pode excluir um orçamento
  const canDeleteQuote = (quoteId: string): boolean => {
    const quote = savedQuotes.find(q => q.id === quoteId);
    if (!quote) return false;
    
    const currentUser = user;
    
    if (!quote.createdBy) {
      return currentUser.role === 'manager' || 
             currentUser.role === 'admin';
    }
    
    return quote.createdBy.id === currentUser.id || 
           currentUser.role === 'manager' || 
           currentUser.role === 'admin';
  };

  return {
    user,
    getCurrentUser: () => user,
    setCurrentUser,
    availableUsers,
    canEditQuote,
    canDeleteQuote,
    savedQuotes,
    loading,
    fetchSystemUsers,
    authenticateUser
  };
}
