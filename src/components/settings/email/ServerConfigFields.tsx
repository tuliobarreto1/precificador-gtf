
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface ServerConfigFieldsProps {
  host: string;
  port: number;
  secure: boolean;
  onHostChange: (value: string) => void;
  onPortChange: (value: number) => void;
  onSecureChange: (value: boolean) => void;
  disabled?: boolean;
  isMailgun?: boolean;
}

const ServerConfigFields: React.FC<ServerConfigFieldsProps> = ({
  host,
  port,
  secure,
  onHostChange,
  onPortChange,
  onSecureChange,
  disabled = false,
  isMailgun = false
}) => {
  if (isMailgun) {
    return null;
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="host">Servidor SMTP</Label>
          <Input
            id="host"
            placeholder="smtp.office365.com"
            value={host}
            onChange={(e) => onHostChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="port">Porta</Label>
          <Input
            id="port"
            type="number"
            placeholder="587"
            value={port}
            onChange={(e) => onPortChange(parseInt(e.target.value) || 587)}
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="secure" className="flex items-center justify-between">
          <span>Conexão Segura (SSL/TLS)</span>
          <Switch 
            id="secure"
            checked={secure}
            onCheckedChange={onSecureChange}
            disabled={disabled}
          />
        </Label>
        <p className="text-xs text-muted-foreground">
          Ative para usar conexão criptografada (recomendado)
        </p>
      </div>
    </>
  );
};

export default ServerConfigFields;
