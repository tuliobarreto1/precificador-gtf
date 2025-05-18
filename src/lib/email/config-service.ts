
/**
 * Serviço para gerenciamento das configurações de email
 */

import { supabase } from '@/integrations/supabase/client';
import { EmailConfig } from './types';

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
    
    console.log("Salvando configurações de e-mail:", {
      provider: config.provider,
      host: config.host,
      port: config.port,
      user: config.user,
      secure: config.secure
    });
    
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
    
    console.log("Configurações de e-mail salvas com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao salvar configurações de email:", error);
    return false;
  }
}
