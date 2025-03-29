import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Vehicle, Client, VehicleGroup, getVehicleGroupById, getClientById, getVehicleById } from '@/lib/mock-data';
import { DepreciationParams, MaintenanceParams, calculateLeaseCost, calculateExtraKmRate } from '@/lib/calculation';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

// Item de veículo na cotação
export type QuoteVehicleItem = {
  vehicle: Vehicle;
  vehicleGroup: VehicleGroup;
  params?: {
    contractMonths: number;
    monthlyKm: number;
    operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
    hasTracking: boolean;
  };
};

// Quote form state
export type QuoteFormData = {
  client: Client | null;
  vehicles: QuoteVehicleItem[];
  useGlobalParams: boolean;
  globalParams: {
    contractMonths: number;
    monthlyKm: number;
    operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
    hasTracking: boolean;
  };
};

// Tipo para registro de edição
export type EditRecord = {
  editedAt: string;
  editedBy: {
    id: number;
    name: string;
    role: 'user' | 'manager' | 'admin';
  };
  changes: string;
};

// Tipos de usuário
export type UserRole = 'user' | 'manager' | 'admin';

// Tipo de usuário
export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastLogin: string;
};

// Resultado do cálculo para um veículo
export type VehicleQuoteResult = {
  vehicleId: string;
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  totalCost: number;
  costPerKm: number;
  extraKmRate: number;
};

// Interface para orçamentos salvos
export type SavedQuote = {
  id: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  contractMonths: number;
  monthlyKm: number;
  totalCost: number;
  createdAt: string;
  createdBy?: User;
  editHistory?: EditRecord[];
  vehicles: {
    vehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    plateNumber?: string;
    groupId: string;
    totalCost: number;
    depreciationCost: number;
    maintenanceCost: number;
    extraKmRate: number;
  }[];
  operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
  hasTracking?: boolean;
  trackingCost?: number;
};

// Usuários do sistema (alinhados com a página de Usuários)
export const mockUsers: User[] = [
  { id: 1, name: 'Admin Principal', email: 'admin@carleasemaster.com.br', role: 'admin', status: 'active', lastLogin: '2023-10-15 14:30' },
  { id: 2, name: 'Gerente de Vendas', email: 'gerente@carleasemaster.com.br', role: 'manager', status: 'active', lastLogin: '2023-10-14 09:15' },
  { id: 3, name: 'Usuário Teste', email: 'teste@carleasemaster.com.br', role: 'user', status: 'active', lastLogin: '2023-10-10 16:45' },
  { id: 4, name: 'Consultor 1', email: 'consultor1@carleasemaster.com.br', role: 'user', status: 'active', lastLogin: '2023-10-09 11:20' },
  { id: 5, name: 'Usuário Inativo', email: 'inativo@carleasemaster.com.br', role: 'user', status: 'inactive', lastLogin: '2023-09-25 10:30' }
];

// Definir usuário padrão (primeiro usuário ativo admin)
export const defaultUser = mockUsers.find(user => user.status === 'active' && user.role === 'admin') || mockUsers[0];

// Chave para armazenar o usuário atual no localStorage
const CURRENT_USER_KEY = 'currentUser';
const SAVED_QUOTES_KEY = 'savedQuotes';

// Context type
type QuoteContextType = {
  quoteForm: QuoteFormData;
  setClient: (client: Client | null) => void;
  addVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  removeVehicle: (vehicleId: string) => void;
  setGlobalContractMonths: (months: number) => void;
  setGlobalMonthlyKm: (km: number) => void;
  setGlobalOperationSeverity: (severity: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setGlobalHasTracking: (hasTracking: boolean) => void;
  setUseGlobalParams: (useGlobal: boolean) => void;
  setVehicleParams: (
    vehicleId: string, 
    params: {
      contractMonths?: number;
      monthlyKm?: number;
      operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
      hasTracking?: boolean;
    }
  ) => void;
  resetForm: () => void;
  calculateQuote: () => {
    vehicleResults: VehicleQuoteResult[];
    totalCost: number;
  } | null;
  savedQuotes: SavedQuote[];
  saveQuote: () => boolean;
  getSavedQuotes: () => SavedQuote[];
  deleteQuote: (quoteId: string) => boolean;
  getCurrentUser: () => User;
  setCurrentUser: (user: User) => void;
  canEditQuote: (quote: SavedQuote) => boolean;
  canDeleteQuote: (quote: SavedQuote) => boolean;
  updateQuote: (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string) => boolean;
  availableUsers: User[];
  authenticateUser: (userId: number, password?: string) => boolean;
  mockUsers: User[];
  loadQuoteForEditing: (quoteId: string) => boolean;
  isEditMode: boolean;
  currentEditingQuoteId: string | null;
  sendQuoteByEmail: (quoteId: string, recipientEmail: string, message: string) => Promise<boolean>;
};

// Initial state
const initialQuoteForm: QuoteFormData = {
  client: null,
  vehicles: [],
  useGlobalParams: true,
  globalParams: {
    contractMonths: 24,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: false,
  },
};

// AQUI ESTAVA O ERRO: Precisamos criar o contexto antes de usá-lo
const QuoteContext = createContext<QuoteContextType>({} as QuoteContextType);

// Provider component
export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>(initialQuoteForm);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [user, setUser] = useState<User>(defaultUser);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditingQuoteId, setCurrentEditingQuoteId] = useState<string | null>(null);
  const [loadingLock, setLoadingLock] = useState<boolean>(false);

  // Carregar cotações salvas e usuário atual do localStorage na inicialização
  useEffect(() => {
    // Carregar usuário
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

    // Carregar cotações
    try {
      const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
      if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes);
        setSavedQuotes(parsedQuotes);
        console.log('Cotações carregadas do localStorage:', parsedQuotes);
      }
    } catch (error) {
      console.error('Erro ao carregar cotações salvas:', error);
    }
  }, []);

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

  // Update functions
  const setClient = (client: Client | null) => {
    setQuoteForm(prev => ({ ...prev, client }));
  };

  const addVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    console.log('Adicionando veículo ao orçamento:', vehicle);
    console.log('Grupo do veículo:', vehicleGroup);
    
    // Verificar se o veículo já existe no orçamento
    if (quoteForm.vehicles.some(item => item.vehicle.id === vehicle.id)) {
      toast({
        title: "Veículo já adicionado",
        description: "Este veículo já foi adicionado ao orçamento.",
        variant: "destructive",
      });
      return;
    }
    
    setQuoteForm(prev => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        { 
          vehicle, 
          vehicleGroup,
          params: null
        }
      ]
    }));

    console.log('Verificando se o veículo está no banco de dados:', vehicle);
    
    // Se for um veículo com placa, verificar se ele já existe no banco de dados
    if (vehicle.plateNumber) {
      supabase
        .from('vehicles')
        .select()
        .eq('plate_number', vehicle.plateNumber)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao verificar veículo no banco de dados:', error);
            return;
          }
          
          if (!data) {
            console.log('Veículo não encontrado no banco de dados, vamos inserir:', vehicle);
            
            // O veículo não existe no banco de dados, vamos inseri-lo
            supabase
              .from('vehicles')
              .insert({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                value: vehicle.value,
                is_used: true, // Explicitamente definir como usado
                plate_number: vehicle.plateNumber,
                color: vehicle.color || '',
                odometer: vehicle.odometer || 0,
                group_id: vehicle.groupId || vehicleGroup.id
              })
              .then(({ error: insertError }) => {
                if (insertError) {
                  console.error('Erro ao inserir veículo no banco de dados:', insertError);
                } else {
                  console.log('Veículo inserido com sucesso no banco de dados!');
                }
              });
          } else {
            console.log('Veículo já existe no banco de dados, verificando atualização:', data);
            
            // O veículo existe, mas vamos atualizar se necessário
            const updates: any = {};
            let needsUpdate = false;
            
            // Verificar cada campo para ver se precisa ser atualizado
            if (vehicle.brand && vehicle.brand !== data.brand) {
              updates.brand = vehicle.brand;
              needsUpdate = true;
            }
            
            if (vehicle.model && vehicle.model !== data.model) {
              updates.model = vehicle.model;
              needsUpdate = true;
            }
            
            if (vehicle.year && vehicle.year !== data.year) {
              updates.year = vehicle.year;
              needsUpdate = true;
            }
            
            if (vehicle.value && vehicle.value !== data.value) {
              updates.value = vehicle.value;
              needsUpdate = true;
            }
            
            if (vehicle.color && vehicle.color !== data.color) {
              updates.color = vehicle.color;
              needsUpdate = true;
            }
            
            if (vehicle.odometer && vehicle.odometer !== data.odometer) {
              updates.odometer = vehicle.odometer;
              needsUpdate = true;
            }
            
            if (vehicle.groupId && vehicle.groupId !== data.group_id) {
              updates.group_id = vehicle.groupId;
              needsUpdate = true;
            }
            
            // Certifique-se de que is_used é true para veículos com placa
            if (data.is_used !== true) {
              updates.is_used = true;
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              console.log('Atualizando veículo no banco de dados com:', updates);
              
              supabase
                .from('vehicles')
                .update(updates)
                .eq('id', data.id)
                .then(({ error: updateError }) => {
                  if (updateError) {
                    console.error('Erro ao atualizar veículo no banco de dados:', updateError);
                  } else {
                    console.log('Veículo atualizado com sucesso no banco de dados!');
                  }
                });
            } else {
              console.log('Nenhuma atualização necessária para o veículo.');
            }
          }
        });
    }
  };

  const removeVehicle = (vehicleId: string) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(item => item.vehicle.id !== vehicleId),
    }));
  };

  const setGlobalContractMonths = (contractMonths: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, contractMonths },
    }));
  };

  const setGlobalMonthlyKm = (monthlyKm: number) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, monthlyKm },
    }));
  };

  const setGlobalOperationSeverity = (operationSeverity: 1 | 2 | 3 | 4 | 5 | 6) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, operationSeverity },
    }));
  };

  const setGlobalHasTracking = (hasTracking: boolean) => {
    setQuoteForm(prev => ({
      ...prev,
      globalParams: { ...prev.globalParams, hasTracking },
    }));
  };

  const setUseGlobalParams = (useGlobalParams: boolean) => {
    setQuoteForm(prev => ({ ...prev, useGlobalParams }));
  };

  const setVehicleParams = (
    vehicleId: string, 
    params: {
      contractMonths?: number;
      monthlyKm?: number;
      operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
      hasTracking?: boolean;
    }
  ) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(item => {
        if (item.vehicle.id === vehicleId) {
          return {
            ...item,
            params: {
              ...(item.params || prev.globalParams),
              ...params
            }
          };
        }
        return item;
      }),
    }));
  };

  const resetForm = () => {
    setQuoteForm(initialQuoteForm);
  };

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

  // Calculate quote
  const calculateQuote = () => {
    const { vehicles, globalParams, useGlobalParams } = quoteForm;
    
    if (vehicles.length === 0) return null;
    
    const vehicleResults: VehicleQuoteResult[] = vehicles.map(item => {
      // Usar parâmetros globais ou específicos do veículo
      const params = useGlobalParams ? globalParams : (item.params || globalParams);
      
      const depreciationParams: DepreciationParams = {
        vehicleValue: item.vehicle.value,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        operationSeverity: params.operationSeverity,
      };
      
      const maintenanceParams: MaintenanceParams = {
        vehicleGroup: item.vehicleGroup.id,
        contractMonths: params.contractMonths,
        monthlyKm: params.monthlyKm,
        hasTracking: params.hasTracking,
      };
      
      const result = calculateLeaseCost(depreciationParams, maintenanceParams);
      const extraKmRate = calculateExtraKmRate(item.vehicle.value);
      
      return {
        vehicleId: item.vehicle.id,
        ...result,
        extraKmRate
      };
    });
    
    // Calcular custo total de todos os veículos
    const totalCost = vehicleResults.reduce((sum, result) => sum + result.totalCost, 0);
    
    return {
      vehicleResults,
      totalCost
    };
  };

  // Função para salvar um orçamento
  const saveQuote = (): boolean => {
    const quoteResult = calculateQuote();
    if (!quoteForm.client || !quoteResult || quoteForm.vehicles.length === 0) {
      console.error('Erro ao salvar orçamento: dados incompletos', {
        client: !!quoteForm.client,
        quoteResult: !!quoteResult,
        vehicles: quoteForm.vehicles.length
      });
      return false;
    }

    // Verificar se estamos em modo de edição
    if (isEditMode && currentEditingQuoteId) {
      // Encontrar o orçamento original
      const originalQuote = savedQuotes.find(q => q.id === currentEditingQuoteId);
      if (!originalQuote) {
        console.error('Orçamento original não encontrado:', currentEditingQuoteId);
        return false;
      }

      // Criar descrição das alterações
      const changeDescription = `Orçamento editado em ${new Date().toLocaleString('pt-BR')}`;
      
      // Criar objeto de atualizações
      const updates: Partial<QuoteFormData> = {
        client: quoteForm.client,
        vehicles: quoteForm.vehicles,
        globalParams: quoteForm.globalParams,
        useGlobalParams: quoteForm.useGlobalParams
      };
      
      // Atualizar o orçamento
      const updated = updateQuote(currentEditingQuoteId, updates, changeDescription);
      
      // Resetar o modo de edição
      if (updated) {
        setIsEditMode(false);
        setCurrentEditingQuoteId(null);
      }
      
      return updated;
    }

    // Caso contrário, continuar com a criação de um novo orçamento
    // Criar um ID único baseado no timestamp (será substituído por UUID no Supabase)
    const newId = Date.now().toString();
    
    // Obter o usuário atual
    const userInfo = getCurrentUser();
    
    // Criar o objeto de orçamento salvo
    const newSavedQuote: SavedQuote = {
      id: newId,
      clientId: quoteForm.client.id,
      clientName: quoteForm.client.name,
      vehicleId: quoteForm.vehicles[0].vehicle.id, // Para compatibilidade com o formato atual
      vehicleBrand: quoteForm.vehicles[0].vehicle.brand,
      vehicleModel: quoteForm.vehicles[0].vehicle.model,
      contractMonths: quoteForm.globalParams.contractMonths,
      monthlyKm: quoteForm.globalParams.monthlyKm,
      totalCost: quoteResult.totalCost,
      createdAt: new Date().toISOString(),
      createdBy: userInfo, // Usar o usuário atual
      editHistory: [],
      vehicles: quoteResult.vehicleResults.map((result, index) => {
        const vehicle = quoteForm.vehicles.find(v => v.vehicle.id === result.vehicleId);
        if (!vehicle) {
          throw new Error(`Veículo não encontrado: ${result.vehicleId}`);
        }
        
        return {
          vehicleId: vehicle.vehicle.id,
          vehicleBrand: vehicle.vehicle.brand,
          vehicleModel: vehicle.vehicle.model,
          plateNumber: vehicle.vehicle.plateNumber,
          groupId: vehicle.vehicleGroup.id,
          totalCost: result.totalCost,
          depreciationCost: result.depreciationCost,
          maintenanceCost: result.maintenanceCost,
          extraKmRate: result.extraKmRate,
        };
      }),
      operationSeverity: quoteForm.globalParams.operationSeverity,
      hasTracking: quoteForm.globalParams.hasTracking,
      trackingCost: quoteResult.vehicleResults[0].trackingCost,
    };

    console.log('📝 Tentando salvar novo orçamento:', {
      clientId: newSavedQuote.clientId,
      clientName: newSavedQuote.clientName,
      totalCost: newSavedQuote.totalCost,
      veículos: newSavedQuote.vehicles.length
    });

    // Também salvar no Supabase e atualizar o ID local se salvo com sucesso
    let finalQuote = { ...newSavedQuote };
    try {
      import('@/integrations/supabase/client').then(async ({ saveQuoteToSupabase }) => {
        console.log('📤 Iniciando salvamento no Supabase...');
        // Passar o objeto cliente completo para a função de salvamento
        const result = await saveQuoteToSupabase({
          ...newSavedQuote,
          client: quoteForm.client // Adicionar cliente aqui
        });
        if (result.success && result.data && result.data[0]) {
          console.log('✅ Orçamento salvo no Supabase com sucesso!', result.data);
          
          // Atualizar o ID local com o UUID gerado pelo Supabase
          const supabaseId = result.data[0].id;
          
          // Atualizar o orçamento local com o ID do Supabase
          setSavedQuotes(prevQuotes => 
            prevQuotes.map(q => 
              q.id === newSavedQuote.id ? { ...q, id: supabaseId } : q
            )
          );
          
          // Atualizar também no localStorage
          try {
            const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
            if (storedQuotes) {
              const parsedQuotes = JSON.parse(storedQuotes);
              const updatedQuotes = parsedQuotes.map((q: SavedQuote) => 
                q.id === newSavedQuote.id ? { ...q, id: supabaseId } : q
              );
              localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
              console.log('✅ ID do orçamento atualizado no localStorage para UUID do Supabase');
            }
          } catch (error) {
            console.error('❌ Erro ao atualizar ID no localStorage:', error);
          }
          
        } else {
          console.error('❌ Falha ao salvar orçamento no Supabase:', result.error);
        }
      }).catch(err => {
        console.error('❌ Erro ao importar função do Supabase:', err);
      });
    } catch (error) {
      console.error('❌ Erro ao tentar salvar no Supabase:', error);
      // Continuar salvando localmente mesmo se falhar no Supabase
    }

    // Atualizar o estado e o localStorage
    const updatedQuotes = [newSavedQuote, ...savedQuotes];
    setSavedQuotes(updatedQuotes);
    
    // Salvar no localStorage com tratamento de erro
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      console.log('✅ Orçamento salvo com sucesso no localStorage:', newSavedQuote);
      console.log('📊 Total de orçamentos salvos:', updatedQuotes.length);
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
      return false;
    }
    
    return true;
  };

  // Função para atualizar um orçamento existente
  const updateQuote = (quoteId: string, updates: Partial<QuoteFormData>, changeDescription: string): boolean => {
    // Encontrar o orçamento a ser atualizado
    const quoteToUpdate = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToUpdate) return false;
    
    // Verificar permissão
    if (!canEditQuote(quoteToUpdate)) {
      console.error('Permissão de edição negada para o usuário:', getCurrentUser());
      return false;
    }
    
    // Registrar a edição no histórico
    const editRecord: EditRecord = {
      editedAt: new Date().toISOString(),
      editedBy: getCurrentUser(),
      changes: changeDescription
    };

    // Calcular os novos valores do orçamento
    const quoteResult = calculateQuote();
    if (!quoteResult) {
      console.error('Erro ao calcular o or��amento atualizado');
      return false;
    }
    
    // Atualizar o orçamento
    const updatedQuotes = savedQuotes.map(quote => {
      if (quote.id === quoteId) {
        return {
          ...quote,
          clientId: updates.client?.id || quote.clientId,
          clientName: updates.client?.name || quote.clientName,
          contractMonths: updates.globalParams?.contractMonths || quote.contractMonths,
          monthlyKm: updates.globalParams?.monthlyKm || quote.monthlyKm,
          totalCost: quoteResult.totalCost,
          operationSeverity: updates.globalParams?.operationSeverity || quote.operationSeverity,
          hasTracking: updates.globalParams?.hasTracking !== undefined ? updates.globalParams.hasTracking : quote.hasTracking,
          vehicles: quoteResult.vehicleResults.map(result => {
            const vehicle = updates.vehicles?.find(v => v.vehicle.id === result.vehicleId)?.vehicle;
            const vehicleGroup = updates.vehicles?.find(v => v.vehicle.id === result.vehicleId)?.vehicleGroup;
            
            if (!vehicle) {
              // Se não encontrou o veículo nas atualizações, manter o veículo original
              const originalVehicle = quote.vehicles.find(v => v.vehicleId === result.vehicleId);
              if (originalVehicle) return originalVehicle;
              
              // Se não encontrou nem nas atualizações nem no original, algo está errado
              throw new Error(`Veículo não encontrado: ${result.vehicleId}`);
            }
            
            return {
              vehicleId: vehicle.id,
              vehicleBrand: vehicle.brand,
              vehicleModel: vehicle.model,
              plateNumber: vehicle.plateNumber,
              groupId: vehicleGroup?.id || quote.vehicles[0].groupId,
              totalCost: result.totalCost,
              depreciationCost: result.depreciationCost,
              maintenanceCost: result.maintenanceCost,
              extraKmRate: result.extraKmRate,
            };
          }),
          editHistory: [...(quote.editHistory || []), editRecord]
        };
      }
      return quote;
    });
    
    // Salvar as alterações
    setSavedQuotes(updatedQuotes);
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
    console.log('Orçamento atualizado com sucesso:', quoteId);
    
    return true;
  };

  // Implementação da função deleteQuote que estava faltando
  const deleteQuote = (quoteId: string): boolean => {
    // Verificar se o orçamento existe
    const quoteToDelete = savedQuotes.find(q => q.id === quoteId);
    if (!quoteToDelete) {
      console.error('Orçamento não encontrado:', quoteId);
      return false;
    }
    
    // Verificar permissão
    if (!canDeleteQuote(quoteToDelete)) {
      console.error('Permissão de exclusão negada para o usuário:', getCurrentUser());
      return false;
    }
    
    // Remover o orçamento
    const updatedQuotes = savedQuotes.filter(q => q.id !== quoteId);
    setSavedQuotes(updatedQuotes);
    
    // Atualizar o localStorage
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      console.log('Orçamento excluído com sucesso:', quoteId);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar localStorage após exclusão:', error);
      return false;
    }
  };

  // Função para carregar um orçamento para edição (melhorada)
  const loadQuoteForEditing = (quoteId: string): boolean => {
    console.log("⏳ Iniciando carregamento de orçamento:", quoteId);
    
    // Verificar se já estamos carregando ou se já estamos editando este orçamento
    if (loadingLock || (isEditMode && currentEditingQuoteId === quoteId)) {
      console.log("⚠️ Ignorando requisição de carregamento - já está em andamento ou o orçamento já está carregado");
      return false;
    }
    
    // Ativar trava de carregamento
    setLoadingLock(true);
    
    try {
      // Garantir que temos os dados mais recentes dos orçamentos salvos
      const retrieveLocalQuotes = () => {
        try {
          const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
          if (storedQuotes) {
            return JSON.parse(storedQuotes);
          }
          return [];
        } catch (error) {
          console.error('❌ Erro ao recuperar orçamentos do localStorage:', error);
          return [];
        }
      };
      
      const allQuotes = retrieveLocalQuotes();
      console.log(`📋 Total de orçamentos disponíveis: ${allQuotes.length}`);
      
      const quoteToEdit = allQuotes.find(q => q.id === quoteId);
      
      if (!quoteToEdit) {
        console.error(`❌ Orçamento com ID ${quoteId} não encontrado`);
        setLoadingLock(false);
        return false;
      }
      
      console.log("✅ Orçamento encontrado:", quoteToEdit);
      
      // Verificar permissões de edição
      if (!canEditQuote(quoteToEdit)) {
        console.error("❌ Usuário não tem permissão para editar este orçamento");
        setLoadingLock(false);
        return false;
      }
      
      // Resetar o formulário antes de carregar os novos dados
      console.log("🔄 Resetando formulário antes do carregamento");
      setQuoteForm(initialQuoteForm);
      
      // Carregar cliente
      const client = getClientById(quoteToEdit.clientId);
      console.log("👤 Tentando carregar cliente:", quoteToEdit.clientId);
      
      if (client) {
        console.log("✅ Cliente encontrado:", client);
        setClient(client);
      } else if (quoteToEdit.clientName) {
        // Se não encontrar o cliente pelo ID, criar um cliente temporário com os dados disponíveis
        console.log("⚠️ Cliente não encontrado, criando temporário com nome:", quoteToEdit.clientName);
        const tempClient: Client = {
          id: quoteToEdit.clientId,
          name: quoteToEdit.clientName,
          document: '',
          type: 'PJ',
          email: ''
        };
        setClient(tempClient);
      } else {
        console.error("❌ Dados do cliente insuficientes");
        setLoadingLock(false);
        return false;
      }
      
      // Configurar os parâmetros globais
      console.log("⚙️ Configurando parâmetros globais");
      setGlobalContractMonths(quoteToEdit.contractMonths);
      setGlobalMonthlyKm(quoteToEdit.monthlyKm);
      
      if (quoteToEdit.operationSeverity) {
        setGlobalOperationSeverity(quoteToEdit.operationSeverity);
      }
      
      if (quoteToEdit.hasTracking !== undefined) {
        setGlobalHasTracking(quoteToEdit.hasTracking);
      }
      
      // Verificar se existem veículos para carregar
      if (!quoteToEdit.vehicles || quoteToEdit.vehicles.length === 0) {
        console.error("❌ Orçamento não possui veículos para carregar");
        setLoadingLock(false);
        return false;
      }
      
      // Carregar veículos de forma síncrona
      console.log(`🚗 Tentando carregar ${quoteToEdit.vehicles.length} veículos`);
      let loadedVehicles = 0;
      const tempVehicles: QuoteVehicleItem[] = [];
      
      for (const vehicleItem of quoteToEdit.vehicles) {
        console.log(`🚗 Carregando veículo ID: ${vehicleItem.vehicleId}, Grupo: ${vehicleItem.groupId}`);
        
        const vehicleFromDB = getVehicleById(vehicleItem.vehicleId);
        if (!vehicleFromDB) {
          console.warn(`⚠️ Veículo não encontrado: ${vehicleItem.vehicleId}`);
          continue;
        }
        
        const vehicleGroup = getVehicleGroupById(vehicleItem.groupId);
        if (!vehicleGroup) {
          console.warn(`⚠️ Grupo de ve��culo não encontrado: ${vehicleItem.groupId}`);
          continue;
        }
        
        console.log(`✅ Adicionando veículo: ${vehicleFromDB.brand} ${vehicleFromDB.model}`);
        tempVehicles.push({
          vehicle: vehicleFromDB,
          vehicleGroup: vehicleGroup,
          params: !quoteForm.useGlobalParams ? { ...quoteForm.globalParams } : undefined
        });
        loadedVehicles++;
      }
      
      if (loadedVehicles === 0) {
        console.error("❌ Nenhum veículo foi carregado com sucesso");
        setLoadingLock(false);
        return false;
      }
      
      // Atualizar os veículos de uma só vez
      setQuoteForm(prev => ({
        ...prev,
        vehicles: tempVehicles
      }));
      
      // Marcar como modo de edição
      console.log("✏️ Ativando modo de edição");
      setIsEditMode(true);
      setCurrentEditingQuoteId(quoteId);
      
      console.log("✅ Orçamento carregado com sucesso para edição:", quoteId);
      setLoadingLock(false);
      return true;
    } catch (error) {
      console.error("❌ Erro ao carregar orçamento para edição:", error);
      // Resetar o estado em caso de erro
      setIsEditMode(false);
      setCurrentEditingQuoteId(null);
      setLoadingLock(false);
      return false;
    }
  };

  // Função para obter orçamentos salvos
  const getSavedQuotes = () => {
    // Tentar recuperar diretamente do localStorage para garantir dados mais recentes
    try {
      const storedQuotes = localStorage.getItem(SAVED_QUOTES_KEY);
      if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes);
        return parsedQuotes;
      }
    } catch (error) {
      console.error('Erro ao recuperar orçamentos do localStorage:', error);
    }
    
    // Se não conseguir recuperar do localStorage, usar o estado
    return savedQuotes;
  };

  // Nova função para enviar orçamento por e-mail
  const sendQuoteByEmail = async (quoteId: string, recipientEmail: string, message: string): Promise<boolean> => {
    try {
      // Buscar o orçamento a ser enviado
      const quoteToSend = savedQuotes.find(q => q.id === quoteId);
      if (!quoteToSend) {
        console.error('Orçamento não encontrado para envio de e-mail:', quoteId);
        return false;
      }

      console.log(`Preparando para enviar orçamento ${quoteId} para ${recipientEmail}`);
      
      // Aqui estaria a integração real com serviço de e-mail
      // Como estamos usando mock, simulamos o envio bem-sucedido
      console.log('E-mail enviado com sucesso para:', recipientEmail);
      
      // Registrar o envio no histórico do orçamento
      const updatedQuotes = savedQuotes.map(quote => {
        if (quote.id === quoteId) {
          const editRecord: EditRecord = {
            editedAt: new Date().toISOString(),
            editedBy: getCurrentUser(),
            changes: `Orçamento enviado por e-mail para ${recipientEmail}`
          };
          
          return {
            ...quote,
            editHistory: [...(quote.editHistory || []), editRecord]
          };
        }
        return quote;
      });
      
      // Atualizar o estado e o localStorage
      setSavedQuotes(updatedQuotes);
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(updatedQuotes));
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar orçamento por e-mail:', error);
      return false;
    }
  };

  return (
    <QuoteContext.Provider value={{
      quoteForm,
      setClient,
      addVehicle,
      removeVehicle,
      setGlobalContractMonths,
      setGlobalMonthlyKm,
      setGlobalOperationSeverity,
      setGlobalHasTracking,
      setUseGlobalParams,
      setVehicleParams,
      resetForm,
      calculateQuote,
      savedQuotes,
      saveQuote,
      getSavedQuotes,
      deleteQuote,
      getCurrentUser,
      setCurrentUser,
      canEditQuote,
      canDeleteQuote,
      updateQuote,
      availableUsers,
      authenticateUser,
      mockUsers,
      loadQuoteForEditing,
      isEditMode,
      currentEditingQuoteId,
      sendQuoteByEmail
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

// Hook to use the quote context
export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};
