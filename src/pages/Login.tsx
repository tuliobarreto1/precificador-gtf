
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
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();
  
  // Obter o caminho de redirecionamento da URL ou usar o padrão
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate(from, { replace: true });
      }
    };
    
    checkUser();
    
    // Configurar listener para alterações no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate(from, { replace: true });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, from]);
  
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
      console.log('🔐 Tentando login com:', email);
      
      // Primeiro, tentamos login na tabela system_users (onde está o administrador)
      const adminLoginResult = await signInAdmin(email, password);
      
      if (adminLoginResult.success) {
        console.log('✅ Login admin bem-sucedido');
        toast.success("Login realizado com sucesso", {
          description: "Bem-vindo(a) de volta!"
        });
        
        // Forçar atualização do contexto de autenticação
        refreshAuth();
        
        // Aguardar um pouco para o contexto ser atualizado
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
        return;
      }
      
      console.log('⚠️ Login admin falhou, tentando Supabase auth...');
      
      // Se não encontrou na tabela system_users, tenta via Supabase auth
      const authLoginResult = await signIn(email, password);
      
      if (authLoginResult.success) {
        console.log('✅ Login Supabase bem-sucedido');
        toast.success("Login realizado com sucesso", {
          description: "Bem-vindo(a) de volta!"
        });
        return;
      }
      
      // Se chegou aqui, não conseguiu autenticar
      console.log('❌ Ambos os métodos de login falharam');
      toast.error("Erro de autenticação", {
        description: "Email ou senha incorretos. Por favor, tente novamente."
      });
      
    } catch (error) {
      console.error('💥 Erro no login:', error);
      toast.error("Erro de autenticação", {
        description: "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente."
      });
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
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Carregando..." : "Entrar"}
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
                <Button type="button" className="w-full" onClick={() => window.location.href = "mailto:tulio.barreto@asalocadora.com.br?subject=Solicitação de Acesso ao Sistema de Precificação"}>
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
