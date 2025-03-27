
import React, { useState } from 'react';
import { ArrowRight, Car, Search, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { searchVehicleByPlate, SqlVehicle } from '@/lib/sql-connection';
import { vehicles, vehicleGroups, getVehicleGroupById } from '@/lib/mock-data';
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { Vehicle, VehicleGroup } from '@/lib/mock-data';

type VehicleSelectorProps = {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  selectedVehicleId?: string | null;
};

type VehicleType = 'new' | 'used';

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ onSelectVehicle, selectedVehicleId }) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('new');
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<SqlVehicle | null>(null);
  const { toast } = useToast();

  const handleVehicleTypeChange = (value: string) => {
    setVehicleType(value as VehicleType);
    setFoundVehicle(null); // Clear found vehicle when changing type
  };

  const handleSearchByPlate = async () => {
    if (!plateNumber.trim()) {
      toast({
        title: "Placa não informada",
        description: "Digite a placa do veículo para buscar.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const vehicle = await searchVehicleByPlate(plateNumber);
      setFoundVehicle(vehicle);
      
      if (!vehicle) {
        toast({
          title: "Veículo não encontrado",
          description: "Nenhum veículo encontrado com esta placa.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFoundVehicle = () => {
    if (!foundVehicle) return;
    
    // Map the SQL vehicle to our app's vehicle model
    const foundVehicleGroup = vehicleGroups.find(g => g.id === foundVehicle.LetraGrupo) || vehicleGroups[0];
    
    const mappedVehicle: Vehicle = {
      id: `used-${foundVehicle.Placa}`,
      brand: foundVehicle.DescricaoModelo.split(' ')[0],
      model: foundVehicle.DescricaoModelo.split(' ').slice(1).join(' '),
      year: parseInt(foundVehicle.AnoFabricacaoModelo),
      value: foundVehicle.ValorCompra,
      groupId: foundVehicleGroup.id,
      isUsed: true,
      plateNumber: foundVehicle.Placa,
      color: foundVehicle.Cor,
      odometer: foundVehicle.OdometroAtual
    };
    
    onSelectVehicle(mappedVehicle, foundVehicleGroup);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-muted/30 p-4 rounded-lg">
        <RadioGroup 
          value={vehicleType} 
          onValueChange={handleVehicleTypeChange}
          className="flex space-x-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="vehicle-new" />
            <Label htmlFor="vehicle-new" className="font-medium cursor-pointer">
              Veículo Novo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="used" id="vehicle-used" />
            <Label htmlFor="vehicle-used" className="font-medium cursor-pointer">
              Veículo Usado
            </Label>
          </div>
        </RadioGroup>
      </div>

      {vehicleType === 'used' && (
        <div className="space-y-4 border p-4 rounded-lg">
          <h3 className="text-base font-medium">Buscar veículo usado por placa</h3>
          
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Digite a placa (ex: ABC1234)" 
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSearchByPlate} 
              disabled={isSearching || !plateNumber.trim()}
            >
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>
          
          {foundVehicle && (
            <div className="border rounded-lg p-4 mt-4 bg-muted/20">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{foundVehicle.DescricaoModelo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {foundVehicle.AnoFabricacaoModelo} • Placa: {foundVehicle.Placa}
                  </p>
                  <div className="mt-2 text-sm">
                    <p>Cor: {foundVehicle.Cor}</p>
                    <p>Combustível: {foundVehicle.TipoCombustivel}</p>
                    <p>Grupo: {foundVehicle.LetraGrupo}</p>
                    <p>Odômetro: {foundVehicle.OdometroAtual.toLocaleString('pt-BR')} km</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {foundVehicle.ValorCompra.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Valor de compra</p>
                  <Button 
                    onClick={handleSelectFoundVehicle}
                    className="mt-3"
                    size="sm"
                  >
                    Selecionar <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Dica: Para testar, use a placa ABC1234
          </p>
        </div>
      )}

      {vehicleType === 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.filter(v => !v.isUsed).map((vehicle) => {
            const group = getVehicleGroupById(vehicle.groupId);
            if (!group) return null;
            
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                vehicleGroup={group}
                isSelected={selectedVehicleId === vehicle.id}
                onClick={() => onSelectVehicle(vehicle, group)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
