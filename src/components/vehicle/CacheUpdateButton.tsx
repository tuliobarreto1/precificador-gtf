
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getVehicleGroups, getVehicleModelsByGroup } from '@/lib/sql-connection';
import { saveVehicleGroupsToCache, saveVehicleModelsToCache } from '@/integrations/supabase/services/locaviaCache';

interface CacheUpdateButtonProps {
  onUpdateComplete?: () => void;
}

const CacheUpdateButton: React.FC<CacheUpdateButtonProps> = ({ onUpdateComplete }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const updateCache = async () => {
    setIsUpdating(true);
    setProgress(0);
    setUpdateStatus('idle');
    setErrorMessage('');

    try {
      // Etapa 1: Buscar grupos de veículos
      setCurrentTask('Buscando grupos de veículos...');
      setProgress(10);
      
      const groups = await getVehicleGroups(false);
      setProgress(30);
      
      if (groups.length === 0) {
        throw new Error('Nenhum grupo de veículo encontrado');
      }

      // Etapa 2: Salvar grupos no cache
      setCurrentTask('Salvando grupos no cache...');
      setProgress(40);
      
      const groupsSaveResult = await saveVehicleGroupsToCache(groups);
      if (!groupsSaveResult.success) {
        throw new Error(`Erro ao salvar grupos: ${groupsSaveResult.error}`);
      }
      setProgress(50);

      // Etapa 3: Buscar e salvar modelos para cada grupo
      setCurrentTask('Buscando modelos de veículos...');
      const totalGroups = groups.length;
      let processedGroups = 0;

      for (const group of groups) {
        setCurrentTask(`Buscando modelos do grupo ${group.Letra}...`);
        
        const models = await getVehicleModelsByGroup(group.Letra, false);
        
        if (models.length > 0) {
          const modelsSaveResult = await saveVehicleModelsToCache(models);
          if (!modelsSaveResult.success) {
            console.warn(`Erro ao salvar modelos do grupo ${group.Letra}:`, modelsSaveResult.error);
          }
        }
        
        processedGroups++;
        const modelProgress = 50 + (processedGroups / totalGroups) * 40;
        setProgress(modelProgress);
      }

      // Etapa 4: Finalizar
      setCurrentTask('Finalizando atualização...');
      setProgress(100);
      
      setUpdateStatus('success');
      setCurrentTask('Cache atualizado com sucesso!');
      
      if (onUpdateComplete) {
        onUpdateComplete();
      }

    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
      setUpdateStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      setCurrentTask('Erro na atualização');
    } finally {
      setIsUpdating(false);
      
      // Limpar status após 5 segundos
      setTimeout(() => {
        setProgress(0);
        setCurrentTask('');
        setUpdateStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const getStatusIcon = () => {
    if (isUpdating) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (updateStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (updateStatus === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <RefreshCw className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isUpdating) {
      return 'Atualizando...';
    }
    if (updateStatus === 'success') {
      return 'Atualizado!';
    }
    if (updateStatus === 'error') {
      return 'Erro na atualização';
    }
    return 'Atualizar Cache';
  };

  const getButtonVariant = () => {
    if (updateStatus === 'success') {
      return 'default';
    }
    if (updateStatus === 'error') {
      return 'destructive';
    }
    return 'outline';
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={updateCache}
        disabled={isUpdating}
        variant={getButtonVariant()}
        className="w-full"
      >
        {getStatusIcon()}
        {getButtonText()}
      </Button>

      {(isUpdating || progress > 0) && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          {currentTask && (
            <p className="text-sm text-muted-foreground text-center">
              {currentTask}
            </p>
          )}
        </div>
      )}

      {updateStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {updateStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Cache atualizado com sucesso! Os dados mais recentes da Locavia foram salvos no cache local.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CacheUpdateButton;
