
import React from 'react';
import { Vehicle, VehicleGroup } from '@/lib/models';
import { SqlVehicle, SqlVehicleModel } from '@/lib/sql-connection';

// Componentes refatorados
import ConnectionStatusAlert from './ConnectionStatusAlert';
import VehicleTypeSelector from './VehicleTypeSelector';
import SelectedVehiclesList from './SelectedVehiclesList';
import UsedVehicleSearch from './UsedVehicleSearch';
import NewVehicleSelector from './NewVehicleSelector';

// Hooks personalizados
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { useVehicleSelection } from './hooks/useVehicleSelection';

type VehicleSelectorProps = {
  onSelectVehicle: (vehicle: Vehicle, vehicleGroup: VehicleGroup) => void;
  selectedVehicles: Vehicle[];
  onRemoveVehicle?: (vehicleId: string) => void;
  onError?: (errorMessage: string | null) => void;
  offlineMode?: boolean;
};

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  onSelectVehicle, 
  selectedVehicles,
  onRemoveVehicle,
  onError,
  offlineMode = false
}) => {
  // Usando os hooks customizados para gerenciar estado e lógica
  const { 
    status, 
    testingConnection, 
    detailedError, 
    diagnosticInfo,
    lastCheckTime,
    failureCount,
    testDatabaseConnection 
  } = useConnectionStatus({ offlineMode, onError });

  const {
    vehicleType,
    handleVehicleTypeChange,
    handleSelectFoundVehicle,
    handleSelectNewVehicle
  } = useVehicleSelection({ onSelectVehicle });

  return (
    <div className="space-y-6 animate-fadeIn">
      <ConnectionStatusAlert
        status={status}
        offlineMode={offlineMode}
        testingConnection={testingConnection}
        error={null}
        detailedError={detailedError}
        diagnosticInfo={diagnosticInfo}
        lastCheckTime={lastCheckTime}
        failureCount={failureCount}
        onTestConnection={testDatabaseConnection}
      />
      
      {detailedError && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm mb-4 overflow-auto max-h-48">
          <p className="font-semibold">Detalhes do erro:</p>
          <pre className="whitespace-pre-wrap mt-1">{detailedError}</pre>
        </div>
      )}
      
      <VehicleTypeSelector 
        value={vehicleType}
        onChange={handleVehicleTypeChange}
      />

      <SelectedVehiclesList 
        vehicles={selectedVehicles}
        onRemove={onRemoveVehicle}
      />

      {vehicleType === 'used' && (
        <UsedVehicleSearch 
          onSelectVehicle={handleSelectFoundVehicle}
          offlineMode={offlineMode}
          onError={onError}
        />
      )}

      {vehicleType === 'new' && (
        <NewVehicleSelector 
          onSelectVehicle={handleSelectNewVehicle}
          offlineMode={offlineMode}
        />
      )}
    </div>
  );
};

export default VehicleSelector;
