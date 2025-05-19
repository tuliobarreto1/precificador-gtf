
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { SqlVehicle, SqlVehicleModel } from '@/lib/sql-connection';

interface UseVehicleSelectionProps {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
}

export const useVehicleSelection = ({ onSelectVehicle }: UseVehicleSelectionProps) => {
  const [vehicleType, setVehicleType] = useState<'new' | 'used'>('new');
  const { toast } = useToast();

  const handleVehicleTypeChange = (value: string) => {
    setVehicleType(value as 'new' | 'used');
  };

  const handleSelectFoundVehicle = (foundVehicle: SqlVehicle) => {
    console.log('Selecionando veículo encontrado:', foundVehicle);
    
    const mappedVehicle: Vehicle = {
      id: `used-${foundVehicle.Placa}`,
      brand: foundVehicle.DescricaoModelo.split(' ')[0],
      model: foundVehicle.DescricaoModelo.split(' ').slice(1).join(' '),
      year: parseInt(foundVehicle.AnoFabricacaoModelo) || new Date().getFullYear(),
      value: foundVehicle.ValorCompra || 0,
      isUsed: true,
      plateNumber: foundVehicle.Placa,
      color: foundVehicle.Cor || '',
      odometer: foundVehicle.OdometroAtual || 0,
      fuelType: foundVehicle.TipoCombustivel || '',
      groupId: foundVehicle.LetraGrupo || 'A',
    };
    
    console.log('Veículo mapeado para adicionar:', mappedVehicle);
    
    const mappedGroup: VehicleGroup = {
      id: foundVehicle.LetraGrupo || 'A',
      name: `Grupo ${foundVehicle.LetraGrupo || 'A'}`,
      description: foundVehicle.DescricaoGrupo || `Veículos do grupo ${foundVehicle.LetraGrupo || 'A'}`,
      revisionKm: 10000,
      revisionCost: 500,
      tireKm: 40000,
      tireCost: 2000
    };
    
    onSelectVehicle(mappedVehicle, mappedGroup);
    
    toast({
      title: "Veículo adicionado",
      description: `${foundVehicle.DescricaoModelo} (${foundVehicle.Placa}) foi adicionado à cotação.`,
    });
  };

  const handleSelectNewVehicle = (
    selectedModel: SqlVehicleModel, 
    quantity: number, 
    customPrice: number, 
    selectedFuelType: string
  ) => {
    // Adicionar a quantidade de veículos selecionada
    for (let i = 0; i < quantity; i++) {
      // Garantimos que cada veículo tenha um ID único usando timestamp + índice
      const uniqueId = `new-${selectedModel.CodigoModelo}-${i}-${Date.now()}`;
      
      const mappedVehicle: Vehicle = {
        id: uniqueId,
        brand: selectedModel.Descricao.split(' ')[0],
        model: selectedModel.Descricao.split(' ').slice(1).join(' '),
        year: new Date().getFullYear(),
        value: customPrice,
        isUsed: false,
        groupId: selectedModel.LetraGrupo,
        fuelType: selectedFuelType
      };
      
      const mappedGroup: VehicleGroup = {
        id: selectedModel.LetraGrupo,
        name: `Grupo ${selectedModel.LetraGrupo}`,
        description: `Veículos do grupo ${selectedModel.LetraGrupo}`,
        revisionKm: 10000,
        revisionCost: 500,
        tireKm: 40000,
        tireCost: 2000
      };
      
      onSelectVehicle(mappedVehicle, mappedGroup);
    }
    
    toast({
      title: "Veículos adicionados",
      description: `${quantity} ${quantity > 1 ? 'veículos' : 'veículo'} ${selectedModel.Descricao} ${quantity > 1 ? 'foram adicionados' : 'foi adicionado'} à cotação.`,
    });
  };

  return {
    vehicleType,
    handleVehicleTypeChange,
    handleSelectFoundVehicle,
    handleSelectNewVehicle
  };
};
