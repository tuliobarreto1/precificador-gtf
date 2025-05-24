
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getVehicleGroups, 
  SqlVehicleGroup, 
  getVehicleModelsByGroup, 
  SqlVehicleModel 
} from '@/lib/sql-connection';

interface UseNewVehicleSelectorProps {
  offlineMode: boolean;
}

export const useNewVehicleSelector = ({ offlineMode }: UseNewVehicleSelectorProps) => {
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
        const groups = await getVehicleGroups();
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
          const models = await getVehicleModelsByGroup(selectedGroup);
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

  return {
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
  };
};
