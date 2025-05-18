
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
    const success = true;
    
    console.log(`Email ${success ? 'enviado com sucesso' : 'falhou ao enviar'} para ${to}`);
    return success;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}
