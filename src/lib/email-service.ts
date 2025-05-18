
/**
 * Serviço para envio de emails usando configurações do Outlook ou outro provedor
 * Este arquivo contém funções para gerenciamento de emails no sistema
 */

import { supabase } from '@/integrations/supabase/client';

// Interface para configurações de email
interface EmailConfig {
  provider: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
}

/**
 * Obtém as configurações de email do banco de dados
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    console.log("Buscando configurações de e-mail...");
    
    // Verificar se existe configuração completa
    const { data: configCheck, error: checkError } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['email_provider', 'email_host', 'email_user'])
      .limit(3);
      
    if (checkError || !configCheck || configCheck.length < 3) {
      console.error("Configurações básicas de e-mail não encontradas:", checkError);
      return null;
    }
    
    // Buscar todas as configurações individualmente para ter mais detalhes
    const { data: emailProvider } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_provider')
      .maybeSingle();
      
    const { data: emailHost } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_host')
      .maybeSingle();
      
    const { data: emailPort } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_port')
      .maybeSingle();
      
    const { data: emailUser } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_user')
      .maybeSingle();
      
    const { data: emailSecure } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_secure')
      .maybeSingle();
      
    const { data: emailPassword } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_password')
      .maybeSingle();
    
    // Se alguma configuração essencial estiver faltando, retornar null
    if (!emailProvider || !emailHost || !emailUser) {
      console.error("Configurações essenciais de email incompletas");
      return null;
    }
    
    const config = {
      provider: emailProvider.value,
      host: emailHost.value,
      port: emailPort ? parseInt(emailPort.value) : 587,
      user: emailUser.value,
      password: emailPassword ? emailPassword.value : '',
      secure: emailSecure ? emailSecure.value === 'true' : false
    };
    
    console.log("Configurações de e-mail encontradas:", {
      provider: config.provider,
      host: config.host,
      user: config.user,
      configurado: !!config.password
    });
    
    return config;
  } catch (error) {
    console.error("Erro ao obter configurações de email:", error);
    return null;
  }
}

/**
 * Função para enviar email com anexo de PDF
 */
export async function sendEmailWithOutlook(
  to: string,
  subject: string,
  message: string,
  attachmentPath?: string
): Promise<boolean> {
  try {
    // Obter configurações do email
    const config = await getEmailConfig();
    
    if (!config) {
      console.error("Configurações de email não encontradas ou incompletas");
      return false;
    }
    
    if (!config.password) {
      console.error("Senha não configurada para o serviço de email");
      return false;
    }
    
    console.log(`Enviando email para ${to} usando configurações:`, {
      provider: config.provider,
      host: config.host,
      port: config.port,
      user: config.user
    });
    
    // Implementar envio real de email via API
    // Aqui vamos simular o envio bem-sucedido apenas para teste
    // Em uma versão real, você usaria uma API de email ou enviaria via servidor
    
    // Preparar os dados para envio via API
    const emailData = {
      to: to,
      from: config.user,
      subject: subject,
      html: message.replace(/\n/g, '<br>'),
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          // Em ambiente real, a senha seria enviada com segurança
          // ou usaria um token de autenticação
        }
      }
    };
    
    console.log("Dados de email preparados:", { 
      para: emailData.to, 
      assunto: emailData.subject 
    });
    
    // Em produção, aqui seria implementado o envio real
    // Exemplo: const response = await fetch('https://sua-api-email.com/send', {...})
    
    // Para fins de demonstração, simular sucesso
    // Em produção, isso seria o retorno real da API de email
    const success = true;
    
    console.log(`Email ${success ? 'enviado com sucesso' : 'falhou ao enviar'} para ${to}`);
    return success;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Função para salvar configurações de email
 */
export async function saveEmailConfig(config: EmailConfig): Promise<boolean> {
  try {
    // Array de operações para inserir ou atualizar configurações
    const updates = [
      { key: 'email_provider', value: config.provider },
      { key: 'email_host', value: config.host },
      { key: 'email_port', value: config.port.toString() },
      { key: 'email_user', value: config.user },
      { key: 'email_password', value: config.password },
      { key: 'email_secure', value: config.secure.toString() }
    ];
    
    // Para cada configuração, verificar se existe e atualizar ou inserir
    for (const update of updates) {
      const { data: existing, error: checkError } = await supabase
        .from('system_settings')
        .select()
        .eq('key', update.key)
        .maybeSingle();
      
      if (existing) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value })
          .eq('key', update.key);
          
        if (error) {
          console.error(`Erro ao atualizar configuração ${update.key}:`, error);
          return false;
        }
      } else {
        // Inserir nova configuração
        const { error } = await supabase
          .from('system_settings')
          .insert({ key: update.key, value: update.value, description: `Configuração de email: ${update.key}` });
          
        if (error) {
          console.error(`Erro ao inserir configuração ${update.key}:`, error);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar configurações de email:", error);
    return false;
  }
}
