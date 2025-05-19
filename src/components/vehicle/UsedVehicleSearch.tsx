
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getVehicleByPlate, SqlVehicle } from '@/lib/sql-connection';

interface UsedVehicleSearchProps {
  onSelectVehicle: (vehicle: SqlVehicle) => void;
  offlineMode: boolean;
  onError?: (errorMessage: string | null) => void;
}

const UsedVehicleSearch: React.FC<UsedVehicleSearchProps> = ({ onSelectVehicle, offlineMode, onError }) => {
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
      const vehicle = await getVehicleByPlate(formattedPlate, offlineMode);
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

  return (
    <div className="space-y-4 border p-4 rounded-lg">
      <h3 className="text-base font-medium">Buscar veículo usado por placa</h3>
      
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Digite a placa (ex: ABC1234)" 
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchByPlate();
            }
          }}
        />
        <Button 
          onClick={handleSearchByPlate} 
          disabled={isSearching || !plateNumber.trim()}
        >
          {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Buscar
        </Button>
      </div>
      
      {isSearching && (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Buscando veículo...</p>
        </div>
      )}
      
      {searchError && !isSearching && !foundVehicle && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
          {searchError}
        </div>
      )}
      
      {foundVehicle && !isSearching && (
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
                onClick={() => onSelectVehicle(foundVehicle)}
                className="mt-3"
                size="sm"
              >
                Adicionar <Plus className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Digite a placa no formato correto (ex: ABC1234)
      </p>
    </div>
  );
};

export default UsedVehicleSearch;
