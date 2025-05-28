
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, User, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const UserMenu = () => {
  const { adminUser, signOut, switchUser, availableUsers } = useAuth();
  const navigate = useNavigate();
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!adminUser) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const handleSwitchUser = async () => {
    if (!selectedUser || !password) {
      toast.error('Por favor, selecione um usuário e digite a senha');
      return;
    }

    setIsLoading(true);
    try {
      const success = await switchUser(selectedUser, password);
      if (success) {
        setShowSwitchDialog(false);
        setSelectedUser('');
        setPassword('');
        toast.success('Usuário trocado com sucesso');
        // Recarregar a página para garantir que todos os dados sejam atualizados
        window.location.reload();
      } else {
        toast.error('Falha na troca de usuário. Verifique as credenciais.');
      }
    } catch (error) {
      toast.error('Erro ao trocar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'supervisor':
        return 'Gerente';
      default:
        return 'Usuário';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium text-sm">{adminUser.name}</div>
                <div className="text-xs text-gray-500">{adminUser.email}</div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between">
              <span>Usuário Atual</span>
              <Badge className={getRoleBadgeColor(adminUser.role)}>
                {getRoleLabel(adminUser.role)}
              </Badge>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowSwitchDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Trocar Usuário
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Usuário</DialogTitle>
            <DialogDescription>
              Selecione um usuário e digite a senha para trocar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-select">Usuário</Label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione um usuário</option>
                {availableUsers
                  .filter(user => user.email !== adminUser.email)
                  .map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.name} ({getRoleLabel(user.role)})
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha do usuário"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSwitchDialog(false);
                setSelectedUser('');
                setPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSwitchUser}
              disabled={isLoading || !selectedUser || !password}
            >
              {isLoading ? 'Trocando...' : 'Trocar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;
