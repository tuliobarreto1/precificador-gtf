
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AuthFieldsProps {
  provider: string;
  user: string;
  password: string;
  onUserChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  disabled?: boolean;
}

const AuthFields: React.FC<AuthFieldsProps> = ({
  provider,
  user,
  password,
  onUserChange,
  onPasswordChange,
  disabled = false
}) => {
  const isMailgun = provider === 'mailgun';
  
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="user">
          {isMailgun ? 'Domínio Mailgun' : 'Email'}
        </Label>
        <Input
          id="user"
          placeholder={
            isMailgun 
              ? "sandboxXXXXXX.mailgun.org" 
              : "seu@email.com"
          }
          value={user}
          onChange={(e) => onUserChange(e.target.value)}
          disabled={disabled || isMailgun}
        />
        {isMailgun && (
          <p className="text-xs text-muted-foreground">
            Para o Mailgun, as configurações já estão pré-definidas.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">
          {isMailgun ? 'API Key Mailgun' : 'Senha'}
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={disabled || isMailgun}
        />
        {isMailgun ? (
          <p className="text-xs text-muted-foreground">
            A API key do Mailgun já está configurada.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Para serviços como Gmail e Outlook, pode ser necessário criar uma senha de aplicativo.
          </p>
        )}
      </div>
      
      {isMailgun && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            <strong>Informação:</strong> O Mailgun está configurado com sua conta sandbox. 
            Para enviar emails para qualquer endereço, você precisará verificá-los no painel do Mailgun 
            ou atualizar para uma conta completa com domínio verificado.
          </p>
        </div>
      )}
    </>
  );
};

export default AuthFields;
