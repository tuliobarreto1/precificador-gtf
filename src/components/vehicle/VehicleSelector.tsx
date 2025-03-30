import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import VehicleCard from '@/components/ui-custom/VehicleCard';
import { getVehicleByPlate, SqlVehicle } from '@/lib/sql-connection';
import { useQuote } from '@/context/QuoteContext';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  value?: number;
  plateNumber?: string;
  color?: string;
  isUsed?: boolean;
  odometer?: number;
  fuelType?: string;
  groupId?: string;
}

interface VehicleGroup {
  id: string;
  name?: string;
  description?: string;
  revisionKm: number;
  revisionCost: number;
  tireKm: number;
  tireCost: number;
}

interface VehicleSelectorProps {
  onSelectVehicle: (vehicle: Vehicle, group: VehicleGroup) => void;
  selectedVehicles: Vehicle[];
  onRemoveVehicle: (vehicleId: string) => void;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ onSelectVehicle, selectedVehicles, onRemoveVehicle }) => {
  const [open, setOpen] = useState(false);
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<SqlVehicle | null>(null);
  const { toast } = useToast();
  const { quoteForm } = useQuote();

  useEffect(() => {
    if (!open) {
      setPlate('');
      setFoundVehicle(null);
    }
  }, [open]);

  // Método para buscar um veículo pela placa
  const handleSearchVehicle = async () => {
    if (!plate) {
      toast({
        title: "Placa obrigatória",
        description: "Digite a placa do veículo que deseja buscar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const vehicle = await getVehicleByPlate(plate);
      if (vehicle) {
        setFoundVehicle(vehicle);
      } else {
        toast({
          title: "Veículo não encontrado",
          description: `Nenhum veículo encontrado com a placa ${plate}`,
          variant: "destructive"
        });
        setFoundVehicle(null);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar veículo",
        description: error.message || "Ocorreu um erro ao buscar o veículo",
        variant: "destructive"
      });
      setFoundVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  // Método para adicionar um veículo pela placa
  const handleAddVehicleByPlate = async () => {
    if (!foundVehicle) {
      toast({
        title: "Nenhum veículo selecionado",
        description: "Busque e selecione um veículo antes de adicionar.",
        variant: "destructive"
      });
      return;
    }
    
    const mappedVehicle: Vehicle = {
      id: uuid(),
      brand: foundVehicle.DescricaoModelo.split(' ')[0],
      model: foundVehicle.DescricaoModelo.split(' ').slice(1).join(' '),
      year: parseInt(foundVehicle.AnoFabricacaoModelo) || new Date().getFullYear(),
      plateNumber: foundVehicle.Placa,
      value: foundVehicle.ValorCompra || 0,
      isUsed: true,
      color: foundVehicle.Cor,
      odometer: foundVehicle.OdometroAtual || 0,
      fuelType: foundVehicle.TipoCombustivel,
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
    setOpen(false);
    toast({
      title: "Veículo adicionado",
      description: `${mappedVehicle.brand} ${mappedVehicle.model} adicionado à cotação.`,
    });
  };

  const isVehicleSelected = (vehicleId: string) => {
    return selectedVehicles.some(vehicle => vehicle.id === vehicleId);
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus size={16} />
            <span>Adicionar Veículo</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Veículo</DialogTitle>
            <DialogDescription>
              Informe a placa do veículo para buscar os dados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="AAA-0000"
                className="col-span-3"
              />
              <Button type="button" onClick={handleSearchVehicle} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            {foundVehicle && (
              <VehicleCard vehicle={foundVehicle} />
            )}
          </div>
          <Button type="button" onClick={handleAddVehicleByPlate} disabled={!foundVehicle}>
            Adicionar Veículo
          </Button>
        </DialogContent>
      </Dialog>

      {selectedVehicles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={isVehicleSelected(vehicle.id)}
            >
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveVehicle(vehicle.id);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remover</span>
              </Button>
            </VehicleCard>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum veículo adicionado.</p>
      )}
    </div>
  );
};

export default VehicleSelector;
