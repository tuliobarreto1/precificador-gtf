
// Utilitário para limpeza completa do estado de autenticação
export const cleanupAuthState = () => {
  console.log('Limpando estado de autenticação...');
  
  // Remover tokens padrão de autenticação
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('currentUser');
  
  // Remover todas as chaves do Supabase auth do localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log(`Removida chave: ${key}`);
    }
  });
  
  // Remover do sessionStorage se estiver em uso
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
        console.log(`Removida chave do sessionStorage: ${key}`);
      }
    });
  }
  
  console.log('Limpeza de estado de autenticação concluída');
};

// Função para verificar conectividade
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    console.warn('Sem conectividade com a internet:', error);
    return false;
  }
};
