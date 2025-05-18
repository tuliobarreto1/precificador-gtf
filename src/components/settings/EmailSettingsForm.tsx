
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getEmailConfig, saveEmailConfig, sendEmailWithOutlook } from '@/lib/email-service';
import { Loader2 } from 'lucide-react';

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
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
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
          // Usar o e-mail do usuário configurado como padrão para o teste
          setTestEmail(emailConfig.user);
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

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      
      // Validar configurações
      if (!config.host || !config.user || !config.password || !testEmail) {
        toast({
          title: "Campos incompletos",
          description: "Preencha todos os campos e informe um e-mail de teste",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`Testando envio de e-mail para ${testEmail} usando configurações:`, {
        provider: config.provider,
        host: config.host,
        user: config.user,
        port: config.port
      });
      
      // Salvar primeiro as configurações atuais
      await saveEmailConfig(config);
      
      // Enviar e-mail de teste
      const success = await sendEmailWithOutlook(
        testEmail,
        "Teste de configuração de e-mail",
        `Este é um e-mail de teste enviado às ${new Date().toLocaleTimeString()} para verificar as configurações do sistema de envio de e-mails.

Suas configurações estão funcionando corretamente!

Detalhes da configuração:
- Servidor SMTP: ${config.host}
- Porta: ${config.port}
- Usuário: ${config.user}
- SSL/TLS: ${config.secure ? 'Ativado' : 'Desativado'}

Esta é uma mensagem automática, por favor não responda.`
      );
      
      if (success) {
        toast({
          title: "E-mail enviado com sucesso",
          description: `Um e-mail de teste foi enviado para ${testEmail}`,
        });
      } else {
        toast({
          title: "Falha no envio",
          description: "Não foi possível enviar o e-mail de teste. Verifique as configurações.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao testar envio de e-mail:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao testar o envio de e-mail",
        variant: "destructive"
      });
    } finally {
      setTestingEmail(false);
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
        
        {/* Seção de teste de e-mail */}
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
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={testingEmail || loading}
              />
            </div>
            <Button 
              onClick={handleTestEmail}
              disabled={testingEmail || loading || saving || !testEmail}
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
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
          <Button
            variant="outline"
            disabled={loading || saving || testingEmail}
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
            disabled={loading || saving || testingEmail}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmailSettingsForm;
