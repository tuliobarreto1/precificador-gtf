import React, { useState, useEffect } from 'react';
import { Search, Plus, Car, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getVehicleByPlate, getVehicleGroups, getVehicleModelsByGroup, SqlVehicle, SqlVehicleGroup, SqlVehicleModel } from '@/lib/sql-connection';
import { getVehiclesFromSupabase } from '@/integrations/supabase';
import { useToast } from '@/hooks/use-toast';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  plateNumber?: string;
  isUsed: boolean;
  groupId?: string;
  color?: string;
  odometer?: number;
  fuelType?: string;
}

interface VehicleGroup {
  id: string;
  name: string;
}

interface VehicleSelectorProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onRemoveVehicle: (vehicleId: string) => void;
  selectedVehicles: Vehicle[];
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  onSelectVehicle, 
  onRemoveVehicle,
  selectedVehicles = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [plateSearch, setPlateSearch] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);
  const [plateSearchResult, setPlateSearchResult] = useState<SqlVehicle | null>(null);
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [vehicleModels, setVehicleModels] = useState<SqlVehicleModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [existingVehicles, setExistingVehicles] = useState<Vehicle[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [filteredExisting, setFilteredExisting] = useState<Vehicle[]>([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadVehicleGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const groups = await getVehicleGroups();
        const mappedGroups = groups.map(group => ({
          id: group.Letra,
          name: `${group.Letra} - ${group.Descricao}`
        }));
        setVehicleGroups(mappedGroups);
        
        if (mappedGroups.length > 0 && !selectedGroup) {
          setSelectedGroup(mappedGroups[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar grupos de veículos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os grupos de veículos.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadVehicleGroups();
  }, [toast]);

  useEffect(() => {
    const loadVehicleModels = async () => {
      if (!selectedGroup) return;
      
      setIsLoadingModels(true);
      setSelectedModel('');
      
      try {
        const models = await getVehicleModelsByGroup(selectedGroup);
        setVehicleModels(models);
        
        if (models.length > 0) {
          setSelectedModel(models[0].CodigoModelo);
        }
      } catch (error) {
        console.error('Erro ao carregar modelos de veículos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os modelos de veículos.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingModels(false);
      }
    };

    if (selectedGroup) {
      loadVehicleModels();
    }
  }, [selectedGroup, toast]);

  const loadExistingVehicles = async () => {
    setIsLoadingExisting(true);
    try {
      const { success, vehicles } = await getVehiclesFromSupabase(false);
      
      if (success && vehicles) {
        const mappedVehicles = vehicles.map(v => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          value: v.value,
          plateNumber: v.plate_number || undefined,
          isUsed: v.is_used,
          groupId: v.group_id,
          color: v.color || undefined,
          odometer: v.odometer || undefined,
          fuelType: v.fuel_type || undefined
        }));
        
        setExistingVehicles(mappedVehicles);
        setFilteredExisting(mappedVehicles);
      } else {
        toast({
          title: 'Aviso',
          description: 'Não foi possível carregar os veículos existentes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar veículos existentes:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  useEffect(() => {
    loadExistingVehicles();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredExisting(existingVehicles);
    } else {
      const filtered = existingVehicles.filter(vehicle => {
        const searchLower = searchTerm.toLowerCase();
        return (
          vehicle.brand.toLowerCase().includes(searchLower) ||
          vehicle.model.toLowerCase().includes(searchLower) ||
          (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(searchLower))
        );
      });
      setFilteredExisting(filtered);
    }
  }, [searchTerm, existingVehicles]);

  useEffect(() => {
    if (showOnlyAvailable) {
      const selectedIds = selectedVehicles.map(v => v.id);
      const available = existingVehicles.filter(v => !selectedIds.includes(v.id));
      setFilteredExisting(available);
    } else {
      if (searchTerm.trim() === '') {
        setFilteredExisting(existingVehicles);
      } else {
        const filtered = existingVehicles.filter(vehicle => {
          const searchLower = searchTerm.toLowerCase();
          return (
            vehicle.brand.toLowerCase().includes(searchLower) ||
            vehicle.model.toLowerCase().includes(searchLower) ||
            (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(searchLower))
          );
        });
        setFilteredExisting(filtered);
      }
    }
  }, [showOnlyAvailable, existingVehicles, selectedVehicles, searchTerm]);

  const handlePlateSearch = async () => {
    if (!plateSearch.trim()) {
      toast({
        title: 'Aviso',
        description: 'Digite uma placa para buscar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearchingPlate(true);
    setPlateSearchResult(null);

    try {
      const vehicle = await getVehicleByPlate(plateSearch.trim());
      setPlateSearchResult(vehicle);
      
      if (!vehicle) {
        toast({
          title: 'Veículo não encontrado',
          description: `Nenhum veículo encontrado com a placa ${plateSearch}.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar veículo por placa:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao buscar o veículo.',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingPlate(false);
    }
  };

  const handleSelectPlateVehicle = () => {
    if (!plateSearchResult) return;

    const brandModel = plateSearchResult.DescricaoModelo.split(' ');
    const brand = brandModel[0];
    const model = brandModel.slice(1).join(' ');

    const selectedVehicle: Vehicle = {
      id: `plate-${plateSearchResult.Placa}`,
      brand,
      model,
      year: parseInt(plateSearchResult.AnoFabricacaoModelo) || new Date().getFullYear(),
      value: plateSearchResult.ValorCompra || 0,
      plateNumber: plateSearchResult.Placa,
      isUsed: true,
      groupId: plateSearchResult.LetraGrupo,
      color: plateSearchResult.Cor,
      odometer: plateSearchResult.OdometroAtual,
      fuelType: plateSearchResult.TipoCombustivel
    };

    onSelectVehicle(selectedVehicle);
    setIsAddDialogOpen(false);
    setPlateSearch('');
    setPlateSearchResult(null);
    
    toast({
      title: 'Veículo adicionado',
      description: `${selectedVehicle.brand} ${selectedVehicle.model} adicionado ao orçamento.`,
    });
  };

  const handleSelectNewVehicle = () => {
    if (!selectedModel || !selectedGroup) {
      toast({
        title: 'Aviso',
        description: 'Selecione um grupo e um modelo de veículo.',
        variant: 'destructive',
      });
      return;
    }

    const model = vehicleModels.find(m => m.CodigoModelo === selectedModel);
    if (!model) return;

    const brandModel = model.Descricao.split(' ');
    const brand = brandModel[0];
    const modelName = brandModel.slice(1).join(' ');

    const timestamp = new Date().getTime();
    const idUnico = `new-${brand}-${modelName}-${timestamp}`;

    const selectedVehicle: Vehicle = {
      id: idUnico,
      brand,
      model: modelName,
      year: new Date().getFullYear(),
      value: model.MaiorValorCompra || 0,
      isUsed: false,
      groupId: selectedGroup
    };

    onSelectVehicle(selectedVehicle);
    setIsAddDialogOpen(false);
    
    toast({
      title: 'Veículo adicionado',
      description: `${selectedVehicle.brand} ${selectedVehicle.model} adicionado ao orçamento.`,
    });
  };

  const handleSelectExistingVehicle = (vehicle: Vehicle) => {
    if (!vehicle.plateNumber) {
      const timestamp = new Date().getTime();
      const idUnico = `new-${vehicle.brand}-${vehicle.model}-${timestamp}`;
      const vehicleWithUniqueId = {
        ...vehicle,
        id: idUnico
      };
      onSelectVehicle(vehicleWithUniqueId);
    } else {
      onSelectVehicle(vehicle);
    }
    
    setIsAddDialogOpen(false);
    
    toast({
      title: 'Veículo adicionado',
      description: `${vehicle.brand} ${vehicle.model} adicionado ao orçamento.`,
    });
  };

  const isVehicleSelected = (vehicleId: string) => {
    return selectedVehicles.some(v => v.id === vehicleId);
  };

  const renderSelectedVehicles = () => {
    if (selectedVehicles.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>Nenhum veículo selecionado</p>
          <p className="text-sm">Clique em "Adicionar Veículo" para começar</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {selectedVehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onRemoveVehicle={() => onRemoveVehicle(vehicle.id)}
            showRemoveButton={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Veículos do Orçamento</h2>
          <p className="text-muted-foreground">
            Selecione os veículos que farão parte deste orçamento
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Adicionar Veículo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Adicionar Veículo</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="existing" className="mt-4" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="existing">Veículos Cadastrados</TabsTrigger>
                <TabsTrigger value="new">Veículo Novo</TabsTrigger>
                <TabsTrigger value="plate">Buscar por Placa</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar veículo por marca, modelo ou placa"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-available" 
                      checked={showOnlyAvailable}
                      onCheckedChange={(checked) => setShowOnlyAvailable(checked as boolean)}
                    />
                    <Label htmlFor="show-available" className="text-sm cursor-pointer">
                      Mostrar apenas disponíveis
                    </Label>
                  </div>
                </div>
                
                {isLoadingExisting ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="border rounded-lg p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredExisting.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhum veículo encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros de busca</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                    {filteredExisting.map(vehicle => {
                      const isSelected = isVehicleSelected(vehicle.id);
                      return (
                        <div 
                          key={vehicle.id} 
                          className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => !isSelected && handleSelectExistingVehicle(vehicle)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{vehicle.brand} {vehicle.model}</h3>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.year} • {vehicle.isUsed ? 'Usado' : 'Novo'}
                                {vehicle.groupId && ` • Grupo ${vehicle.groupId}`}
                              </p>
                              {vehicle.plateNumber && (
                                <Badge variant="outline" className="mt-1">
                                  {vehicle.plateNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">R$ {vehicle.value.toLocaleString('pt-BR')}</p>
                              {isSelected && (
                                <Badge className="bg-primary mt-1">Selecionado</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="new" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group">Grupo do Veículo</Label>
                    <Select 
                      value={selectedGroup} 
                      onValueChange={setSelectedGroup}
                      disabled={isLoadingGroups}
                    >
                      <SelectTrigger id="group">
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo do Veículo</Label>
                    <Select 
                      value={selectedModel} 
                      onValueChange={setSelectedModel}
                      disabled={isLoadingModels || !selectedGroup}
                    >
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleModels.map(model => (
                          <SelectItem key={model.CodigoModelo} value={model.CodigoModelo}>
                            {model.Descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedModel && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                    <h3 className="font-medium mb-2">Detalhes do Veículo</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Modelo:</span>
                        <p>{vehicleModels.find(m => m.CodigoModelo === selectedModel)?.Descricao}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grupo:</span>
                        <p>{vehicleModels.find(m => m.CodigoModelo === selectedModel)?.LetraGrupo}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor de Referência:</span>
                        <p>R$ {(vehicleModels.find(m => m.CodigoModelo === selectedModel)?.MaiorValorCompra || 0).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSelectNewVehicle} disabled={!selectedModel}>
                    Adicionar Veículo Novo
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="plate" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite a placa do veículo"
                      className="pl-8"
                      value={plateSearch}
                      onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                      maxLength={7}
                    />
                  </div>
                  <Button onClick={handlePlateSearch} disabled={isSearchingPlate}>
                    {isSearchingPlate ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
                
                {isSearchingPlate ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Buscando veículo...</p>
                  </div>
                ) : plateSearchResult ? (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-medium mb-2">Veículo Encontrado</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Modelo:</span>
                        <p>{plateSearchResult.DescricaoModelo}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Placa:</span>
                        <p>{plateSearchResult.Placa}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ano:</span>
                        <p>{plateSearchResult.AnoFabricacaoModelo}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cor:</span>
                        <p>{plateSearchResult.Cor}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grupo:</span>
                        <p>{plateSearchResult.LetraGrupo} - {plateSearchResult.DescricaoGrupo}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <p>R$ {plateSearchResult.ValorCompra.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleSelectPlateVehicle}>
                        Adicionar Veículo
                      </Button>
                    </div>
                  </div>
                ) : plateSearch ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <X className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhum veículo encontrado</p>
                    <p className="text-sm">Verifique a placa e tente novamente</p>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedVehicles.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="bg-primary/10">
            {selectedVehicles.length} veículo(s) selecionado(s)
          </Badge>
          
          {selectedVehicles.some(v => v.isUsed) && (
            <Badge variant="outline" className="bg-blue-500/10">
              {selectedVehicles.filter(v => v.isUsed).length} usado(s)
            </Badge>
          )}
          
          {selectedVehicles.some(v => !v.isUsed) && (
            <Badge variant="outline" className="bg-green-500/10">
              {selectedVehicles.filter(v => !v.isUsed).length} novo(s)
            </Badge>
          )}
        </div>
      )}
      
      {renderSelectedVehicles()}
    </div>
  );
};

export default VehicleSelector;
