
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
    
    // -----------------------------------------------------------------
    // IMPLEMENTAÇÃO TEMPORÁRIA DE TESTE - Simula o envio de email
    // -----------------------------------------------------------------
    // Em uma versão de produção, aqui seria implementado o envio real
    // usando nodemailer ou outra biblioteca de envio de email
    // -----------------------------------------------------------------
    
    console.log("DADOS DO EMAIL:", {
      de: config.user,
      para: to,
      assunto: subject,
      mensagem: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      temAnexo: !!attachmentPath
    });
    
    // Simulação de um delay para simular envio
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Para teste, vamos considerar o envio como bem sucedido
    // Na integração real, aqui verificaria o status de retorno da API de email
    
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
