
/**
 * Tipos para os serviços de email
 */

// Interface para configurações de email
export interface EmailConfig {
  provider: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
}

// Interface para um email a ser enviado
export interface EmailOptions {
  to: string;
  subject: string;
  message: string;
  attachmentPath?: string;
}
