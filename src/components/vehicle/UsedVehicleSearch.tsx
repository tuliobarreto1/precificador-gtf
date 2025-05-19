
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Plus } from 'lucide-react';
import { SqlVehicle } from '@/lib/sql-connection';
import { useUsedVehicleSearch } from './hooks/useUsedVehicleSearch';

interface UsedVehicleSearchProps {
  onSelectVehicle: (vehicle: SqlVehicle) => void;
  offlineMode: boolean;
  onError?: (errorMessage: string | null) => void;
}

const UsedVehicleSearch: React.FC<UsedVehicleSearchProps> = ({ onSelectVehicle, offlineMode, onError }) => {
  const {
    plateNumber,
    setPlateNumber,
    isSearching,
    searchError,
    foundVehicle,
    handleSearchByPlate
  } = useUsedVehicleSearch({ offlineMode, onError });

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
