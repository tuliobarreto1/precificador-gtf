
import { QuoteFormData, QuoteParams } from '@/context/types/quoteTypes';
import { Vehicle, VehicleGroup } from '@/lib/models';

export function useQuoteVehicles(quoteForm: QuoteFormData, setQuoteForm: React.Dispatch<React.SetStateAction<QuoteFormData>>) {
  
  const addVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    // Verificar se o veículo já está na lista
    const exists = quoteForm.vehicles.some(item => item.vehicle.id === vehicle.id);
    if (exists) return;
    
    // Adicionar o veículo à lista
    setQuoteForm(prev => {
      // Configurar os parâmetros do veículo como uma cópia dos globais caso não esteja usando parâmetros globais
      const vehicleParams = !prev.useGlobalParams ? { ...prev.globalParams } : undefined;
      
      return {
        ...prev,
        vehicles: [
          ...prev.vehicles,
          {
            vehicle,
            vehicleGroup,
            params: vehicleParams
          }
        ]
      };
    });
  };
  
  const removeVehicle = (vehicleId: string) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(item => item.vehicle.id !== vehicleId)
    }));
  };
  
  const setVehicleParams = (vehicleId: string, params: Partial<QuoteParams>) => {
    setQuoteForm(prev => {
      // Encontrar o veículo para atualizar os parâmetros
      const vehicleIndex = prev.vehicles.findIndex(item => item.vehicle.id === vehicleId);
      if (vehicleIndex === -1) return prev;
      
      // Copiar o array de veículos
      const updatedVehicles = [...prev.vehicles];
      
      // Verificar se o veículo já tem parâmetros definidos
      if (updatedVehicles[vehicleIndex].params) {
        // Atualizar os parâmetros existentes
        updatedVehicles[vehicleIndex] = {
          ...updatedVehicles[vehicleIndex],
          params: {
            ...updatedVehicles[vehicleIndex].params!,
            ...params
          }
        };
      } else {
        // Criar novos parâmetros baseados nos globais e nos parâmetros fornecidos
        updatedVehicles[vehicleIndex] = {
          ...updatedVehicles[vehicleIndex],
          params: {
            ...prev.globalParams,
            ...params
          }
        };
      }
      
      return {
        ...prev,
        vehicles: updatedVehicles
      };
    });
  };
  
  return {
    addVehicle,
    removeVehicle,
    setVehicleParams
  };
}
