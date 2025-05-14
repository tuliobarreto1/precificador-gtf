
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getEmailConfig, saveEmailConfig } from '@/lib/email-service';

interface EmailConfig {
  provider: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
}

const EmailSettingsForm: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<EmailConfig>({
    provider: 'outlook',
    host: 'smtp.office365.com',
    port: 587,
    user: '',
    password: '',
    secure: true
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const emailConfig = await getEmailConfig();
        
        if (emailConfig) {
          setConfig(emailConfig);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de email:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de email",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, [toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validar configurações
      if (!config.host || !config.user || !config.password) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }
      
      const success = await saveEmailConfig(config);
      
      if (success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações de email foram salvas com sucesso"
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível salvar as configurações de email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao salvar configurações de email:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de email",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EmailConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Configurações de Email</h2>
      <p className="text-muted-foreground mb-6">
        Configure o serviço de email para enviar propostas e notificações.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provedor</Label>
            <Input
              id="provider"
              placeholder="outlook"
              value={config.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
              disabled={loading || saving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="host">Servidor SMTP</Label>
            <Input
              id="host"
              placeholder="smtp.office365.com"
              value={config.host}
              onChange={(e) => handleChange('host', e.target.value)}
              disabled={loading || saving}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="port">Porta</Label>
            <Input
              id="port"
              type="number"
              placeholder="587"
              value={config.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value) || 587)}
              disabled={loading || saving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secure" className="flex items-center justify-between">
              <span>Conexão Segura (SSL/TLS)</span>
              <Switch 
                id="secure"
                checked={config.secure}
                onCheckedChange={(value) => handleChange('secure', value)}
                disabled={loading || saving}
              />
            </Label>
            <p className="text-xs text-muted-foreground">
              Ative para usar conexão criptografada (recomendado)
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="user">Email</Label>
          <Input
            id="user"
            placeholder="seu@email.com"
            value={config.user}
            onChange={(e) => handleChange('user', e.target.value)}
            disabled={loading || saving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={config.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={loading || saving}
          />
          <p className="text-xs text-muted-foreground">
            Para serviços como Gmail e Outlook, pode ser necessário criar uma senha de aplicativo.
          </p>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            disabled={loading || saving}
            onClick={() => setConfig({
              provider: 'outlook',
              host: 'smtp.office365.com',
              port: 587,
              user: '',
              password: '',
              secure: true
            })}
          >
            Restaurar Padrões
          </Button>
          <Button
            disabled={loading || saving}
            onClick={handleSave}
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmailSettingsForm;
