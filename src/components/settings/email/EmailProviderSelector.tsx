
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailConfig } from '@/lib/email/types';

interface EmailProviderSelectorProps {
  value: string;
  onChange: (provider: string) => void;
  disabled?: boolean;
}

const EmailProviderSelector: React.FC<EmailProviderSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="provider">Provedor</Label>
      <Select 
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o provedor de email" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Provedores de Email</SelectLabel>
            <SelectItem value="outlook">Microsoft Outlook</SelectItem>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="mailgun">Mailgun API</SelectItem>
            <SelectItem value="outro">Outro (SMTP)</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default EmailProviderSelector;
