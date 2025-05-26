
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { syncAllVehicles, getLastSyncStatus, SyncStatus } from '@/lib/vehicle-sync';
import { useToast } from '@/hooks/use-toast';

interface VehicleSyncButtonProps {
  onSyncComplete?: () => void;
}

const VehicleSyncButton: React.FC<VehicleSyncButtonProps> = ({ onSyncComplete }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    progress: 0,
    currentTask: '',
    totalVehicles: 0,
    processedVehicles: 0,
    errors: []
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number>(0);
  const { toast } = useToast();

  // Carregar status da última sincronização
  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getLastSyncStatus();
      setLastSync(status.lastSync);
      setVehicleCount(status.vehicleCount);
    } catch (error) {
      console.error('Erro ao carregar status da sincronização:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isRunning: true, errors: [] }));
      
      const result = await syncAllVehicles((status) => {
        setSyncStatus(status);
      });

      if (result.success) {
        toast({
          title: "Sincronização concluída",
          description: result.message,
          variant: "default"
        });
        
        await loadSyncStatus();
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast({
          title: "Erro na sincronização",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao executar sincronização:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao executar sincronização completa",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, isRunning: false }));
      }, 2000);
    }
  };

  const getButtonIcon = () => {
    if (syncStatus.isRunning) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (syncStatus.progress === 100 && !syncStatus.isRunning) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Download className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (syncStatus.isRunning) {
      return 'Sincronizando...';
    }
    if (syncStatus.progress === 100 && !syncStatus.isRunning) {
      return 'Sincronizado!';
    }
    return 'Sincronizar Todos os Veículos';
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800">Sincronização Completa de Veículos</h3>
        </div>
        
        <p className="text-sm text-slate-600">
          Baixe todos os veículos da base da Locavia para ter acesso completo offline
        </p>
        
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>Última sincronização: {formatLastSync(lastSync)}</span>
          <span>{vehicleCount.toLocaleString('pt-BR')} veículos no cache</span>
        </div>
      </div>

      <Button
        onClick={handleSync}
        disabled={syncStatus.isRunning}
        className="w-full"
        size="lg"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {syncStatus.isRunning && (
        <div className="space-y-2">
          <Progress value={syncStatus.progress} className="w-full" />
          <div className="text-sm text-center text-muted-foreground">
            <p>{syncStatus.currentTask}</p>
            {syncStatus.totalVehicles > 0 && (
              <p>
                {syncStatus.processedVehicles} / {syncStatus.totalVehicles} veículos processados
              </p>
            )}
          </div>
        </div>
      )}

      {syncStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erros na sincronização</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {syncStatus.errors.slice(0, 3).map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
              {syncStatus.errors.length > 3 && (
                <li className="text-sm">... e mais {syncStatus.errors.length - 3} erros</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {syncStatus.progress === 100 && !syncStatus.isRunning && syncStatus.errors.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Sincronização Concluída</AlertTitle>
          <AlertDescription className="text-green-700">
            Todos os veículos foram sincronizados com sucesso! Agora você pode trabalhar offline com acesso completo à base de dados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VehicleSyncButton;
