
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { SqlVehicleModel } from '@/lib/sql-connection';
import { useNewVehicleSelector } from './hooks/useNewVehicleSelector';
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
  const {
    vehicleGroups,
    selectedGroup,
    setSelectedGroup,
    vehicleModels,
    selectedModel,
    setSelectedModel,
    customPrice,
    setCustomPrice,
    loadingGroups,
    loadingModels,
    quantity,
    setQuantity,
    selectedFuelType,
    setSelectedFuelType,
    handleQuantityChange
  } = useNewVehicleSelector({ offlineMode });

  const handleSelectNewVehicle = () => {
    if (!selectedModel) {
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
