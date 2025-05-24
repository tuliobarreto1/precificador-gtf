
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getVehicleByPlate, SqlVehicle } from '@/lib/sql-connection';

interface UseUsedVehicleSearchProps {
  offlineMode: boolean;
  onError?: (errorMessage: string | null) => void;
}

export const useUsedVehicleSearch = ({ offlineMode, onError }: UseUsedVehicleSearchProps) => {
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundVehicle, setFoundVehicle] = useState<SqlVehicle | null>(null);
  const { toast } = useToast();

  // Função para formatar a placa para o padrão correto
  const formatPlateNumber = (plate: string): string => {
    // Remove espaços e caracteres especiais
    let formatted = plate.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Verifica se a placa já está no formato correto
    if (/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(formatted)) {
      return formatted;
    }
    
    // Retorna a placa como está se não pudermos formatá-la corretamente
    return formatted;
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

    // Formatar a placa conforme padrão Mercosul (se não estiver)
    const formattedPlate = formatPlateNumber(plateNumber);
    
    setIsSearching(true);
    setSearchError(null);
    setFoundVehicle(null);
    if (onError) onError(null);
    
    try {
      console.log(`Iniciando busca de veículo com placa: ${formattedPlate}`);
      const vehicle = await getVehicleByPlate(formattedPlate);
      console.log('Resultado da busca:', vehicle);
      
      setFoundVehicle(vehicle);
      
      if (!vehicle) {
        const errorMsg = `Nenhum veículo encontrado com a placa ${formattedPlate}`;
        setSearchError(errorMsg);
        if (onError) onError(null); // Não é um erro de conexão, então não propagamos
        
        toast({
          title: "Veículo não encontrado",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        if (onError) onError(null);
        toast({
          title: "Veículo encontrado",
          description: `Veículo ${vehicle.DescricaoModelo} encontrado com sucesso.`,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar veículo:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar veículo";
      setSearchError(errorMessage);
      
      // Verificamos se é um erro de conexão para propagar para o componente pai
      if (errorMessage.includes('conectar') || 
          errorMessage.includes('timeout') || 
          errorMessage.includes('offline') || 
          errorMessage.includes('servidor')) {
        if (onError) onError(errorMessage);
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return {
    plateNumber,
    setPlateNumber,
    isSearching,
    searchError,
    foundVehicle,
    handleSearchByPlate
  };
};
