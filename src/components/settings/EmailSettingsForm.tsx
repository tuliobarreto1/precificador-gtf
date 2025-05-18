
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getEmailConfig, saveEmailConfig } from '@/lib/email/config-service';
import { sendEmailWithOutlook } from '@/lib/email/sender-service';
import { EmailConfig } from '@/lib/email/types';
import { Loader2 } from 'lucide-react';

// Importar os componentes recém-criados
import EmailProviderSelector from './email/EmailProviderSelector';
import ServerConfigFields from './email/ServerConfigFields';
import AuthFields from './email/AuthFields';
import TestEmailSection from './email/TestEmailSection';

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
      
      // Enviar e-mail de teste - utilizando a interface EmailOptions
      const success = await sendEmailWithOutlook({
        to: testEmail,
        subject: "Teste de configuração de e-mail",
        message: `Este é um e-mail de teste enviado às ${new Date().toLocaleTimeString()} para verificar as configurações do sistema de envio de e-mails.

Suas configurações estão funcionando corretamente!

Detalhes da configuração:
- Provedor: ${config.provider}
- Servidor: ${config.host}
- Porta: ${config.port}
- Usuário: ${config.user}
- SSL/TLS: ${config.secure ? 'Ativado' : 'Desativado'}

Esta é uma mensagem automática, por favor não responda.`
      });
      
      if (success) {
        toast({
          title: "E-mail enviado com sucesso",
          description: `Um e-mail de teste foi enviado para ${testEmail}. Verifique sua caixa de entrada e pasta de spam.`,
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

  // Atualizar configurações com base no provedor selecionado
  const handleProviderChange = (provider: string) => {
    let updatedConfig = { ...config, provider };
    
    // Configurações padrão com base no provedor selecionado
    if (provider === 'outlook') {
      updatedConfig.host = 'smtp.office365.com';
      updatedConfig.port = 587;
      updatedConfig.secure = true;
    } else if (provider === 'gmail') {
      updatedConfig.host = 'smtp.gmail.com';
      updatedConfig.port = 587;
      updatedConfig.secure = true;
    } else if (provider === 'mailgun') {
      updatedConfig.host = 'api.mailgun.net';
      updatedConfig.port = 443;
      updatedConfig.secure = true;
      updatedConfig.user = 'postmaster@sandboxb21f3c354b9a4bb48eb2e723c7e35355.mailgun.org';
      updatedConfig.password = 'af7e4708aac6ebf0b6521bb5ce25aa30-e71583bb-593ac6c0';
    }
    
    setConfig(updatedConfig);
  };

  const handleChange = (field: keyof EmailConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isMailgun = config.provider === 'mailgun';
  const isDisabled = loading || saving;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Configurações de Email</h2>
      <p className="text-muted-foreground mb-6">
        Configure o serviço de email para enviar propostas e notificações.
      </p>
      
      <div className="space-y-4">
        <EmailProviderSelector 
          value={config.provider}
          onChange={handleProviderChange}
          disabled={isDisabled}
        />
        
        <ServerConfigFields 
          host={config.host}
          port={config.port}
          secure={config.secure}
          onHostChange={(value) => handleChange('host', value)}
          onPortChange={(value) => handleChange('port', value)}
          onSecureChange={(value) => handleChange('secure', value)}
          disabled={isDisabled}
          isMailgun={isMailgun}
        />
        
        <AuthFields 
          provider={config.provider}
          user={config.user}
          password={config.password}
          onUserChange={(value) => handleChange('user', value)}
          onPasswordChange={(value) => handleChange('password', value)}
          disabled={isDisabled}
        />
        
        <TestEmailSection 
          testEmail={testEmail}
          onTestEmailChange={setTestEmail}
          onSendTest={handleTestEmail}
          disabled={isDisabled}
          isMailgun={isMailgun}
          testingEmail={testingEmail}
        />
        
        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
          <Button
            variant="outline"
            disabled={isDisabled || testingEmail}
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
            disabled={isDisabled || testingEmail}
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
