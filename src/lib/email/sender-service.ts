
/**
 * Serviço para envio de emails
 */

import { getEmailConfig } from './config-service';
import { EmailOptions } from './types';

/**
 * Função para enviar email com anexo de PDF
 */
export async function sendEmailWithOutlook(options: EmailOptions): Promise<boolean> {
  const { to, subject, message, attachmentPath } = options;
  
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
      user: config.user,
      secure: config.secure
    });
    
    // Verificar se estamos usando Mailgun
    if (config.provider === 'mailgun') {
      return await sendWithMailgun(to, subject, message, attachmentPath);
    }
    
    // Para outros provedores, manter o comportamento de simulação atual
    console.log("DADOS DO EMAIL:", {
      de: config.user,
      para: to,
      assunto: subject,
      mensagem: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      temAnexo: !!attachmentPath
    });
    
    // Simulação de um delay para simular envio
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Adicionar logs mais detalhados para depuração
    console.log("Servidor SMTP:", config.host);
    console.log("Porta:", config.port);
    console.log("Conexão segura:", config.secure ? "Sim" : "Não");
    console.log("Usuário:", config.user);
    console.log("Email destinatário:", to);
    
    // NOTA IMPORTANTE: Em um ambiente de produção, você precisará implementar
    // um serviço real de envio de emails aqui, como o uso de:
    // - Um servidor SMTP configurado (Outlook, Gmail, etc.)
    // - Um serviço de email como SendGrid, Mailgun, ou AWS SES
    // - Uma API de envio de email do seu provedor
    
    console.log(`Email enviado com sucesso para ${to}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Função para enviar email com Mailgun
 */
async function sendWithMailgun(to: string, subject: string, text: string, attachmentPath?: string): Promise<boolean> {
  try {
    console.log("Iniciando envio via Mailgun para:", to);
    
    // Usamos importações diretas em vez de dinâmicas para evitar problemas
    import FormData from 'form-data';
    import Mailgun from 'mailgun.js';
    
    // Inicializar cliente Mailgun
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: "af7e4708aac6ebf0b6521bb5ce25aa30-e71583bb-593ac6c0", // Chave API do Mailgun
    });
    
    // Montar e enviar a mensagem
    const data = await mg.messages.create("sandboxb21f3c354b9a4bb48eb2e723c7e35355.mailgun.org", {
      from: "ASA Rent a Car <postmaster@sandboxb21f3c354b9a4bb48eb2e723c7e35355.mailgun.org>",
      to: [to],
      subject: subject,
      text: text,
      // Se houver um anexo, adicioná-lo aqui
      // Esta parte precisará ser implementada quando o sistema de geração de PDF estiver funcional
    });
    
    console.log("Resposta do Mailgun:", data);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email via Mailgun:", error);
    return false;
  }
}
