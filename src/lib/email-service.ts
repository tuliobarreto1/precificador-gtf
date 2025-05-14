
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
    // Buscar configurações do supabase (table system_settings)
    const { data: emailProvider, error: providerError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_provider')
      .single();
      
    const { data: emailHost, error: hostError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_host')
      .single();
      
    const { data: emailPort, error: portError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_port')
      .single();
      
    const { data: emailUser, error: userError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_user')
      .single();
      
    const { data: emailSecure, error: secureError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_secure')
      .single();
      
    // Se alguma configuração estiver faltando, retornar null
    if (providerError || hostError || portError || userError || secureError) {
      console.error("Configurações de email incompletas:", { 
        providerError, hostError, portError, userError, secureError 
      });
      return null;
    }
    
    // Obter senha (em uma aplicação real, isso seria criptografado)
    const { data: emailPassword, error: passwordError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'email_password')
      .single();
    
    if (passwordError) {
      console.error("Senha de email não configurada:", passwordError);
      return null;
    }
    
    return {
      provider: emailProvider.value,
      host: emailHost.value,
      port: parseInt(emailPort.value),
      user: emailUser.value,
      password: emailPassword.value,
      secure: emailSecure.value === 'true'
    };
  } catch (error) {
    console.error("Erro ao obter configurações de email:", error);
    return null;
  }
}

/**
 * Função para enviar email usando Outlook ou outro provider configurado
 * Na versão atual, apenas simula o envio
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
      console.error("Configurações de email não encontradas");
      return false;
    }
    
    console.log(`Simulando envio de email para ${to} usando configurações:`, {
      provider: config.provider,
      host: config.host,
      port: config.port,
      user: config.user,
      secure: config.secure
    });
    
    // Em uma implementação real, aqui seria a lógica de envio de email
    // utilizando nodemailer, sendgrid ou outro serviço
    
    // Simular sucesso
    return true;
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
