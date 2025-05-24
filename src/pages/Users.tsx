import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import Card, { CardHeader } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MoreHorizontal, Search, UserPlus, Edit, Trash2, RefreshCw, Key } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useQuoteUsers } from '@/hooks/useQuoteUsers';

type UserRole = 'admin' | 'supervisor' | 'user';
type UserStatus = 'active' | 'inactive';

type UserType = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
};

const UserRoleText = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'supervisor':
      return 'Supervisor';
    case 'user':
      return 'Usuário';
    default:
      return role;
  }
};

const UserStatusBadge = ({ status }: { status: string }) => {
  return (
    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
      {status === 'active' ? 'Ativo' : 'Inativo'}
    </Badge>
  );
};

const Users = () => {
  const { user: currentUser, availableUsers, loading: hookLoading, fetchSystemUsers } = useQuoteUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [newUser, setNewUser] = useState<UserType>({ 
    id: '', 
    name: '', 
    email: '', 
    role: 'user', 
    status: 'active', 
    password: '' 
  });
  const [newPassword, setNewPassword] = useState('');

  console.log('🔍 Dados carregados na página Users:', {
    currentUser,
    availableUsersCount: availableUsers.length,
    availableUsers,
    hookLoading
  });

  // Usar diretamente os usuários do hook
  const users = availableUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus,
  }));

  const isCurrentUserAdmin = currentUser?.role === 'admin';

  // Recarregar dados quando necessário
  const handleRefreshUsers = async () => {
    console.log('🔄 Atualizando lista de usuários...');
    try {
      await fetchSystemUsers();
      toast.success('Lista de usuários atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar usuários:', error);
      toast.error('Erro ao atualizar lista de usuários');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_users')
        .insert({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          status: newUser.status
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      setNewUser({ id: '', name: '', email: '', role: 'user', status: 'active', password: '' });
      setIsAddUserOpen(false);
      
      await fetchSystemUsers();
      toast.success("Usuário adicionado com sucesso");
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error("Erro ao adicionar usuário");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('system_users')
        .update({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          status: editingUser.status
        })
        .eq('id', editingUser.id);
      
      if (error) {
        throw error;
      }
      
      setIsEditUserOpen(false);
      await fetchSystemUsers();
      toast.success("Usuário atualizado com sucesso");
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    
    if (editingUser.role === 'admin' && !isCurrentUserAdmin) {
      toast.error('Você não tem permissão para excluir um administrador');
      setIsDeleteConfirmOpen(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', editingUser.id);
      
      if (error) {
        throw error;
      }
      
      setIsDeleteConfirmOpen(false);
      await fetchSystemUsers();
      toast.success('Usuário removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const userToUpdate = users.find(user => user.id === userId);
    if (!userToUpdate) return;
    
    if (userToUpdate.role === 'admin' && userToUpdate.status === 'active' && !isCurrentUserAdmin) {
      toast.error('Você não tem permissão para desativar um administrador');
      return;
    }
    
    const newStatus = userToUpdate.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      await fetchSystemUsers();
      toast.success(`Usuário ${userToUpdate.name} agora está ${newStatus === 'active' ? 'ativo' : 'inativo'}`);
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      toast.error('Erro ao atualizar status do usuário');
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || !newPassword) {
      toast.error('Por favor, informe a nova senha');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ password: newPassword })
        .eq('id', editingUser.id);
      
      if (error) {
        throw error;
      }
      
      setIsResetPasswordOpen(false);
      setNewPassword('');
      toast.success(`Senha do usuário ${editingUser.name} foi redefinida`);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha');
    }
  };

  return (
    <MainLayout>
      <PageTitle 
        title="Usuários" 
        subtitle="Gerencie os usuários do sistema"
      />

      <Card>
        <CardHeader 
          title="Lista de Usuários" 
          subtitle={`Visualize, adicione, edite e remova usuários do sistema (Total: ${users.length})`}
          action={
            <Button onClick={() => setIsAddUserOpen(true)}>
              <UserPlus size={16} className="mr-2" />
              Novo Usuário
            </Button>
          }
        />

        <div className="p-6 pt-0">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleRefreshUsers}>
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>

          {hookLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Carregando usuários...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><UserRoleText role={user.role} /></TableCell>
                        <TableCell><UserStatusBadge status={user.status} /></TableCell>
                        <TableCell>Nunca</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setEditingUser(user);
                                setIsEditUserOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingUser(user);
                                setNewPassword('');
                                setIsResetPasswordOpen(true);
                              }}>
                                <Key className="mr-2 h-4 w-4" />
                                Redefinir Senha
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {user.status === 'active' ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                disabled={user.role === 'admin' && !isCurrentUserAdmin}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {searchQuery ? 'Nenhum usuário encontrado com esses critérios.' : 'Nenhum usuário cadastrado no sistema.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Modal para adicionar usuário */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password || ''}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Digite a senha"
              />
            </div>
            <div className="grid gap-2">
              <Label>Função</Label>
              <RadioGroup
                value={newUser.role}
                onValueChange={(value: 'admin' | 'supervisor' | 'user') => setNewUser({...newUser, role: value})}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" disabled={!isCurrentUserAdmin} />
                  <Label htmlFor="admin">Administrador</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="supervisor" id="supervisor" />
                  <Label htmlFor="supervisor">Supervisor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user">Usuário</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newUser.status === 'active'}
                  onCheckedChange={(checked) => 
                    setNewUser({...newUser, status: checked ? 'active' : 'inactive'})
                  }
                />
                <Label>{newUser.status === 'active' ? 'Ativo' : 'Inativo'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddUser}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuário */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique os dados do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Função</Label>
                <RadioGroup
                  value={editingUser.role}
                  onValueChange={(value: 'admin' | 'supervisor' | 'user') => 
                    setEditingUser({...editingUser, role: value})
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="admin" 
                      id="edit-admin" 
                      disabled={!isCurrentUserAdmin || (editingUser.role === 'admin' && !isCurrentUserAdmin)}
                    />
                    <Label htmlFor="edit-admin">Administrador</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="supervisor" id="edit-supervisor" />
                    <Label htmlFor="edit-supervisor">Supervisor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="edit-user" />
                    <Label htmlFor="edit-user">Usuário</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingUser.status === 'active'}
                    onCheckedChange={(checked) => 
                      setEditingUser({...editingUser, status: checked ? 'active' : 'inactive'})
                    }
                    disabled={editingUser.role === 'admin' && !isCurrentUserAdmin}
                  />
                  <Label>{editingUser.status === 'active' ? 'Ativo' : 'Inativo'}</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para redefinir senha */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              {editingUser && `Digite a nova senha para ${editingUser.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>Redefinir Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para exclusão */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {editingUser && `Tem certeza que deseja excluir o usuário ${editingUser.name}?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Users;
