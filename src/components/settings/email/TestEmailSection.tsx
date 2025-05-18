
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface TestEmailSectionProps {
  testEmail: string;
  onTestEmailChange: (value: string) => void;
  onSendTest: () => Promise<void>;
  disabled: boolean;
  isMailgun: boolean;
  testingEmail: boolean;
}

const TestEmailSection: React.FC<TestEmailSectionProps> = ({
  testEmail,
  onTestEmailChange,
  onSendTest,
  disabled,
  isMailgun,
  testingEmail
}) => {
  return (
    <div className="border-t pt-4 mt-6">
      <h3 className="text-lg font-medium mb-4">Testar Configurações</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="test-email">E-mail de teste</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="email@para.teste"
            value={testEmail}
            onChange={(e) => onTestEmailChange(e.target.value)}
            disabled={testingEmail || disabled}
          />
        </div>
        <Button 
          onClick={onSendTest}
          disabled={testingEmail || disabled || !testEmail}
          className="w-full"
        >
          {testingEmail ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : 'Enviar E-mail de Teste'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Envie um e-mail de teste para verificar se suas configurações estão funcionando corretamente.
      </p>
      {!isMailgun && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-orange-700 text-sm">
            <strong>NOTA:</strong> Este é um ambiente de demonstração e o envio real de emails não está habilitado. 
            Em produção, será necessário configurar um serviço SMTP real ou uma API de envio de emails.
          </p>
        </div>
      )}
    </div>
  );
};

export default TestEmailSection;
