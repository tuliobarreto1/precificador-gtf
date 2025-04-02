
import { useState } from 'react';
import { QuoteFormData, QuoteVehicleItem } from '@/context/types/quoteTypes';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useQuoteVehicles(quoteForm: QuoteFormData, setQuoteForm: React.Dispatch<React.SetStateAction<QuoteFormData>>) {
  const { toast } = useToast();

  const addVehicle = (vehicle: Vehicle, vehicleGroup: VehicleGroup) => {
    console.log('Adicionando veículo ao orçamento:', vehicle);
    console.log('Grupo do veículo:', vehicleGroup);
    
    // Verificar se o veículo já existe no orçamento
    if (quoteForm.vehicles.some(item => item.vehicle.id === vehicle.id)) {
      toast({
        title: "Veículo já adicionado",
        description: "Este veículo já foi adicionado ao orçamento.",
        variant: "destructive",
      });
      return;
    }
    
    setQuoteForm(prev => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        { 
          vehicle, 
          vehicleGroup,
          params: null
        }
      ]
    }));

    console.log('Verificando se o veículo está no banco de dados:', vehicle);
    
    // Verificar se o veículo existe no banco de dados usando placa (se tiver) ou combinação de marca/modelo
    const checkVehicle = () => {
      if (vehicle.plateNumber) {
        return supabase
          .from('vehicles')
          .select()
          .eq('plate_number', vehicle.plateNumber)
          .maybeSingle();
      } else {
        return supabase
          .from('vehicles')
          .select()
          .eq('brand', vehicle.brand)
          .eq('model', vehicle.model)
          .eq('year', vehicle.year)
          .maybeSingle();
      }
    };

    checkVehicle().then(({ data, error }) => {
      if (error) {
        console.error('Erro ao verificar veículo no banco de dados:', error);
        return;
      }
      
      if (!data) {
        console.log('Veículo não encontrado no banco de dados, vamos inserir:', vehicle);
        
        // O veículo não existe no banco de dados, vamos inseri-lo
        supabase
          .from('vehicles')
          .insert({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            value: vehicle.value,
            is_used: vehicle.plateNumber ? true : false, // Define como usado apenas se tiver placa
            plate_number: vehicle.plateNumber || null,
            color: vehicle.color || '',
            odometer: vehicle.odometer || 0,
            group_id: vehicle.groupId || vehicleGroup.id
          })
          .then(({ error: insertError }) => {
            if (insertError) {
              console.error('Erro ao inserir veículo no banco de dados:', insertError);
            } else {
              console.log('Veículo inserido com sucesso no banco de dados!');
            }
          });
      } else {
        console.log('Veículo já existe no banco de dados, verificando atualização:', data);
        
        // O veículo existe, mas vamos atualizar se necessário
        const updates: any = {};
        let needsUpdate = false;
        
        // Verificar cada campo para ver se precisa ser atualizado
        if (vehicle.brand && vehicle.brand !== data.brand) {
          updates.brand = vehicle.brand;
          needsUpdate = true;
        }
        
        if (vehicle.model && vehicle.model !== data.model) {
          updates.model = vehicle.model;
          needsUpdate = true;
        }
        
        if (vehicle.year && vehicle.year !== data.year) {
          updates.year = vehicle.year;
          needsUpdate = true;
        }
        
        if (vehicle.value && vehicle.value !== data.value) {
          updates.value = vehicle.value;
          needsUpdate = true;
        }
        
        if (vehicle.color && vehicle.color !== data.color) {
          updates.color = vehicle.color;
          needsUpdate = true;
        }
        
        if (vehicle.odometer && vehicle.odometer !== data.odometer) {
          updates.odometer = vehicle.odometer;
          needsUpdate = true;
        }
        
        if (vehicle.groupId && vehicle.groupId !== data.group_id) {
          updates.group_id = vehicle.groupId;
          needsUpdate = true;
        }
        
        // Certifique-se de que is_used é true para veículos com placa
        if (data.is_used !== true && vehicle.plateNumber) {
          updates.is_used = true;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          console.log('Atualizando veículo no banco de dados com:', updates);
          
          supabase
            .from('vehicles')
            .update(updates)
            .eq('id', data.id)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.error('Erro ao atualizar veículo no banco de dados:', updateError);
              } else {
                console.log('Veículo atualizado com sucesso no banco de dados!');
              }
            });
        } else {
          console.log('Nenhuma atualização necessária para o veículo.');
        }
      }
    });
  };

  const removeVehicle = (vehicleId: string) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(item => item.vehicle.id !== vehicleId),
    }));
  };

  const setVehicleParams = (
    vehicleId: string, 
    params: {
      contractMonths?: number;
      monthlyKm?: number;
      operationSeverity?: 1 | 2 | 3 | 4 | 5 | 6;
      hasTracking?: boolean;
    }
  ) => {
    setQuoteForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(item => {
        if (item.vehicle.id === vehicleId) {
          return {
            ...item,
            params: {
              ...(item.params || prev.globalParams),
              ...params
            }
          };
        }
        return item;
      }),
    }));
  };

  return {
    addVehicle,
    removeVehicle,
    setVehicleParams
  };
}
