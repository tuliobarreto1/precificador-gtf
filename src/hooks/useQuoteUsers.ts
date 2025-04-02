
import { useState, useEffect } from 'react';
import { User, SavedQuote, defaultUser, mockUsers } from '@/context/types/quoteTypes';

// Chave para armazenar o usuário atual no localStorage
const CURRENT_USER_KEY = 'currentUser';

export function useQuoteUsers() {
  const [user, setUser] = useState<User>(defaultUser);

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Validar se o usuário ainda existe na lista de usuários
        const validUser = mockUsers.find(u => u.id === parsedUser.id);
        if (validUser) {
          setUser(validUser);
          console.log('Usuário carregado do localStorage:', validUser);
        } else {
          // Se o usuário não existir mais, usar o usuário padrão
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
          setUser(defaultUser);
          console.log('Usuário não encontrado, usando padrão:', defaultUser);
        }
      } else {
        // Se não houver usuário salvo, salvar o usuário padrão
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
        console.log('Usuário padrão definido:', defaultUser);
      }
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

  // Lista de usuários disponíveis (somente usuários ativos)
  const availableUsers = mockUsers.filter(user => user.status === 'active');

  // Function to authenticate a user by ID
  const authenticateUser = (userId: number, password?: string): boolean => {
    const foundUser = mockUsers.find(u => u.id === userId && u.status === 'active');
    
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
    
    // Se não houver informações sobre quem criou, permitir edição para todos (para fins de demo)
    if (!quote.createdBy) {
      return true;
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
    
    // Se não houver informações sobre quem criou, permitir exclusão para todos (para fins de demo)
    if (!quote.createdBy) {
      return true;
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
