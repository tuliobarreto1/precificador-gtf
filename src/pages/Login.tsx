
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { signIn, signInAdmin } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, checkConnectivity } from '@/lib/auth-cleanup';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obter o caminho de redirecionamento da URL ou usar o padrão
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    console.log('Componente Login montado');
    
    // Verificar conectividade
    const checkConnection = async () => {
      const isOnline = await checkConnectivity();
      setConnectionStatus(isOnline ? 'online' : 'offline');
      console.log('Status de conectividade:', isOnline ? 'online' : 'offline');
    };
    
    checkConnection();
    
    // Limpar estado de autenticação ao montar o componente
    cleanupAuthState();
    
    // Verificar se o usuário já está autenticado
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Usuário já autenticado, redirecionando...');
          navigate(from, { replace: true });
        }
      } catch (error) {
        console.log('Erro ao verificar sessão existente:', error);
        // Continuar normalmente se houver erro
      }
    };
    
    if (connectionStatus === 'online') {
      checkUser();
    }
    
    // Configurar listener para alterações no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Evento de autenticação:', event);
      if (session && event === 'SIGNED_IN') {
        navigate(from, { replace: true });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, from, connectionStatus]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha todos os campos obrigatórios."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Iniciando processo de login para:', email);
      
      // Limpar estado antes de tentar login
      cleanupAuthState();
      
      // Tentar logout global primeiro para garantir estado limpo
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('Logout global executado com sucesso');
      } catch (err) {
        console.log('Erro no logout global (continuando):', err);
      }
      
      // Verificar conectividade antes de tentar login
      const isOnline = await checkConnectivity();
      if (!isOnline) {
        toast.error("Sem conexão", {
          description: "Verifique sua conexão com a internet e tente novamente."
        });
        return;
      }
      
      // Primeiro, tentamos login na tabela system_users (onde está o administrador)
      console.log('Tentando login via system_users...');
      const adminLoginResult = await signInAdmin(email, password);
      
      if (adminLoginResult.success) {
        console.log('Login via system_users bem-sucedido');
        toast.success("Login realizado com sucesso", {
          description: "Bem-vindo(a) de volta!"
        });
        
        // Usar setTimeout para garantir que o estado seja atualizado
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
        return;
      }
      
      console.log('Login via system_users falhou, tentando Supabase auth...');
      
      // Se não encontrou na tabela system_users, tenta via Supabase auth
      const authLoginResult = await signIn(email, password);
      
      if (authLoginResult.success) {
        console.log('Login via Supabase auth bem-sucedido');
        toast.success("Login realizado com sucesso", {
          description: "Bem-vindo(a) de volta!"
        });
        return;
      }
      
      // Se chegou aqui, não conseguiu autenticar
      console.log('Ambos os métodos de login falharam');
      toast.error("Erro de autenticação", {
        description: "Email ou senha incorretos. Verifique suas credenciais e tente novamente."
      });
      
    } catch (error) {
      console.error('Erro no processo de login:', error);
      
      // Verificar se é erro de conectividade
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Erro de conexão", {
          description: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        });
      } else {
        toast.error("Erro de autenticação", {
          description: "Ocorreu um erro inesperado. Por favor, tente novamente em alguns instantes."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/84236534-3718-40d2-a32e-197758066390.png" 
            alt="ASA Rent a Car" 
            className="h-12 mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold">Gerador de Propostas GTF</h1>
          <p className="text-gray-500 mt-2">Sistema de Precificação de Frota</p>
          
          {/* Indicador de status de conexão */}
          <div className="mt-2">
            {connectionStatus === 'checking' && (
              <span className="text-sm text-yellow-600">Verificando conexão...</span>
            )}
            {connectionStatus === 'offline' && (
              <span className="text-sm text-red-600">⚠️ Sem conexão com a internet</span>
            )}
            {connectionStatus === 'online' && (
              <span className="text-sm text-green-600">✓ Conectado</span>
            )}
          </div>
        </div>
        
        <Card className="w-full">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register" disabled>Solicitar Acesso</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Entre com sua conta para continuar</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={connectionStatus === 'offline'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <Input 
                      id="password" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={connectionStatus === 'offline'}
                    />
                  </div>
                  
                  {connectionStatus === 'offline' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        Sem conexão com a internet. Verifique sua conexão e recarregue a página.
                      </p>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || connectionStatus === 'offline'}
                  >
                    {isLoading ? "Verificando credenciais..." : "Entrar"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader>
                <CardTitle>Solicitar Acesso</CardTitle>
                <CardDescription>
                  Por favor, entre em contato com o administrador do sistema para solicitar acesso.
                </CardDescription>
              </CardHeader>
              
              <CardFooter>
                <Button type="button" className="w-full" onClick={() => window.location.href = "mailto:tulio.barreto@asalocadoa.com.br?subject=Solicitação de Acesso ao Sistema de Precificação"}>
                  Enviar email para administrador
                </Button>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
