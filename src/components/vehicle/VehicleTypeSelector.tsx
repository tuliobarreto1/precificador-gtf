
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface VehicleTypeSelectorProps {
  value: 'new' | 'used';
  onChange: (value: 'new' | 'used') => void;
}

const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <RadioGroup 
        value={value} 
        onValueChange={onChange}
        className="flex space-x-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="vehicle-new" />
          <Label htmlFor="vehicle-new" className="font-medium cursor-pointer">
            Veículo Novo
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="used" id="vehicle-used" />
          <Label htmlFor="vehicle-used" className="font-medium cursor-pointer">
            Veículo Usado
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default VehicleTypeSelector;
