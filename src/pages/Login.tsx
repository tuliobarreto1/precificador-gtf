
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/context/QuoteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { authenticateUser, mockUsers } = useQuote();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de login
    setTimeout(() => {
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'active');
      
      if (user) {
        // Em um sistema real, verificaríamos a senha aqui
        const authenticated = authenticateUser(user.id);
        
        if (authenticated) {
          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo(a), ${user.name}!`,
          });
          navigate('/');
        } else {
          toast({
            title: "Erro de autenticação",
            description: "Não foi possível autenticar o usuário.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos ou usuário inativo.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Precificador GTF</h1>
          <p className="text-muted-foreground mt-2">Faça login para acessar o sistema</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        
        <div className="pt-4 text-center text-sm border-t">
          <p className="text-muted-foreground">
            Credenciais de demonstração:
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p><strong>Admin:</strong> admin@carleasemaster.com.br</p>
            <p><strong>Gerente:</strong> gerente@carleasemaster.com.br</p>
            <p><strong>Usuário:</strong> teste@carleasemaster.com.br</p>
            <p className="mt-2 italic text-muted-foreground">Senha: qualquer valor</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
