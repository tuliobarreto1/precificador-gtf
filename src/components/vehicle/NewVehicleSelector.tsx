
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getVehicleGroups, 
  SqlVehicleGroup, 
  getVehicleModelsByGroup, 
  SqlVehicleModel 
} from '@/lib/sql-connection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewVehicleSelectorProps {
  onSelectVehicle: (model: SqlVehicleModel, quantity: number, customPrice: number, fuelType: string) => void;
  offlineMode: boolean;
}

const NewVehicleSelector: React.FC<NewVehicleSelectorProps> = ({ onSelectVehicle, offlineMode }) => {
  const [vehicleGroups, setVehicleGroups] = useState<SqlVehicleGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [vehicleModels, setVehicleModels] = useState<SqlVehicleModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SqlVehicleModel | null>(null);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedFuelType, setSelectedFuelType] = useState<string>('Flex');
  
  const { toast } = useToast();

  useEffect(() => {
    const loadVehicleGroups = async () => {
      try {
        setLoadingGroups(true);
        const groups = await getVehicleGroups(offlineMode);
        setVehicleGroups(groups);
        console.log('Grupos de veículos carregados:', groups);
      } catch (error) {
        console.error('Erro ao carregar grupos de veículos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os grupos de veículos.",
          variant: "destructive",
        });
      } finally {
        setLoadingGroups(false);
      }
    };
    
    loadVehicleGroups();
  }, [toast, offlineMode]);
  
  useEffect(() => {
    const loadVehicleModels = async () => {
      if (selectedGroup) {
        try {
          setLoadingModels(true);
          setSelectedModel(null);
          const models = await getVehicleModelsByGroup(selectedGroup, offlineMode);
          setVehicleModels(models);
          console.log('Modelos de veículos carregados:', models);
        } catch (error) {
          console.error('Erro ao carregar modelos de veículos:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os modelos de veículos.",
            variant: "destructive",
          });
        } finally {
          setLoadingModels(false);
        }
      }
    };
    
    loadVehicleModels();
  }, [selectedGroup, toast, offlineMode]);
  
  useEffect(() => {
    if (selectedModel) {
      setCustomPrice(selectedModel.MaiorValorCompra || 0);
    } else {
      setCustomPrice(null);
    }
  }, [selectedModel]);

  const handleQuantityChange = (increment: boolean) => {
    setQuantity(prev => {
      const newValue = increment ? prev + 1 : prev - 1;
      return Math.max(1, newValue); // Não permitir valores menores que 1
    });
  };

  const handleSelectNewVehicle = () => {
    if (!selectedModel) {
      toast({
        title: "Modelo não selecionado",
        description: "Selecione um modelo de veículo para adicionar à cotação.",
        variant: "destructive"
      });
      return;
    }
    
    const finalPrice = customPrice !== null ? customPrice : selectedModel.MaiorValorCompra;
    
    onSelectVehicle(selectedModel, quantity, finalPrice, selectedFuelType);
    
    setSelectedModel(null);
    setCustomPrice(null);
    setQuantity(1);
  };

  return (
    <div className="space-y-6 border p-4 rounded-lg">
      <h3 className="text-base font-medium">Selecionar veículo novo por grupo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="group" className="mb-2 block">Grupo de Veículos</Label>
          <Select 
            onValueChange={(value) => setSelectedGroup(value)}
            value={selectedGroup || undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um grupo" />
            </SelectTrigger>
            <SelectContent>
              {loadingGroups ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Carregando grupos...</span>
                </div>
              ) : (
                vehicleGroups.map(group => (
                  <SelectItem key={group.CodigoGrupo} value={group.Letra}>
                    Grupo {group.Letra} - {group.Descricao}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="model" className="mb-2 block">Modelo de Veículo</Label>
          <Select 
            onValueChange={(value) => {
              const model = vehicleModels.find(m => m.CodigoModelo === value);
              setSelectedModel(model || null);
            }}
            value={selectedModel?.CodigoModelo || undefined}
            disabled={!selectedGroup || loadingModels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {loadingModels ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Carregando modelos...</span>
                </div>
              ) : (
                vehicleModels.map(model => (
                  <SelectItem key={model.CodigoModelo} value={model.CodigoModelo}>
                    {model.Descricao}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedModel && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{selectedModel.Descricao}</h3>
              <p className="text-sm text-muted-foreground">
                Grupo {selectedModel.LetraGrupo} • {new Date().getFullYear()}
              </p>
              
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuel-type" className="text-sm">Tipo de Combustível</Label>
                  <Select 
                    onValueChange={setSelectedFuelType}
                    value={selectedFuelType}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quantity" className="text-sm">Quantidade</Label>
                  <div className="flex items-center mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(false)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center mx-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Label htmlFor="custom-price" className="text-xs text-muted-foreground">Valor de compra (R$)</Label>
              <Input
                id="custom-price"
                type="number"
                value={customPrice || ''}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                className="w-40 mt-1"
                placeholder="Valor de compra"
              />
              <Button 
                onClick={handleSelectNewVehicle}
                className="mt-3"
                size="sm"
                disabled={!customPrice}
              >
                Adicionar <Plus className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Selecione um grupo e depois um modelo de veículo para adicionar à cotação.
      </p>
    </div>
  );
};

export default NewVehicleSelector;
