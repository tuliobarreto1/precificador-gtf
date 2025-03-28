
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import PageTitle from '@/components/ui-custom/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Client = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  created_at: string;
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const lowercaseTerm = searchTerm.toLowerCase();
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(lowercaseTerm) || 
        (client.document && client.document.toLowerCase().includes(lowercaseTerm)) ||
        (client.email && client.email.toLowerCase().includes(lowercaseTerm)) ||
        (client.city && client.city.toLowerCase().includes(lowercaseTerm))
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setClients(data);
        setFilteredClients(data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error.message);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clientId: string) => {
    navigate(`/cliente/${clientId}`);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Verificar se o cliente está em uso em algum orçamento
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('id')
        .eq('client_id', clientToDelete.id)
        .limit(1);
        
      if (quotesError) throw quotesError;
      
      if (quotesData && quotesData.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este cliente está vinculado a orçamentos e não pode ser excluído.",
          variant: "destructive",
        });
        setIsDeleting(false);
        setClientToDelete(null);
        return;
      }
      
      // Se não estiver em uso, proceder com a exclusão
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      // Atualizar a lista de clientes
      setClients(clients.filter(client => client.id !== clientToDelete.id));
      
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error.message);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const handleRefresh = () => {
    fetchClients();
    toast({
      title: "Lista atualizada",
      description: "A lista de clientes foi atualizada com sucesso."
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <PageTitle 
            title="Clientes" 
            subtitle="Gerencie os clientes da sua empresa"
            className="mb-4 md:mb-0"
          />
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Atualizar
            </Button>
            <Link to="/cliente/novo">
              <Button className="flex gap-2 items-center">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Total de {filteredClients.length} clientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Nenhum cliente encontrado</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm ? 'Tente uma busca diferente ou' : 'Comece'} cadastrando um novo cliente.
                </p>
                <Link to="/cliente/novo">
                  <Button className="mt-4">Cadastrar Cliente</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {getInitials(client.name)}
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.document || <span className="text-muted-foreground text-sm">Não informado</span>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && <p className="text-sm">{client.email}</p>}
                            {client.phone && <p className="text-sm">{client.phone}</p>}
                            {!client.email && !client.phone && (
                              <span className="text-muted-foreground text-sm">Não informado</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.city && client.state ? (
                            <Badge variant="outline">
                              {client.city}/{client.state}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(client.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setClientToDelete(client)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.name}</strong>?
                                    <div className="mt-2 flex items-center p-3 bg-amber-50 text-amber-800 rounded-md">
                                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                      <span>Esta ação não poderá ser desfeita.</span>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDelete();
                                    }}
                                    disabled={isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Clients;
