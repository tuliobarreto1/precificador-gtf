
import { useState } from 'react';
import { sendEmailWithOutlook } from '@/lib/email-service';
import { useToast } from '@/hooks/use-toast';

export function useQuoteEmails(getCurrentUser: () => any) {
  const { toast } = useToast();
  
  // Implementação do método sendQuoteByEmail
  const sendQuoteByEmail = async (quoteId: string, email: string, message: string): Promise<boolean> => {
    try {
      console.log(`Enviando orçamento ${quoteId} por e-mail para ${email}`);
      
      // Buscar os detalhes do orçamento
      const { quote: quoteData, error: quoteError } = await import('@/integrations/supabase/services/quotes')
        .then(module => module.getQuoteByIdFromSupabase(quoteId));
        
      if (quoteError || !quoteData) {
        console.error("Erro ao buscar dados do orçamento:", quoteError);
        toast({
          title: "Erro ao enviar e-mail",
          description: "Não foi possível obter os detalhes do orçamento",
          variant: "destructive"
        });
        return false;
      }
      
      // Preparar o assunto do e-mail
      const clientName = quoteData.clientName || 'Cliente';
      const emailSubject = `Proposta de locação de veículos - ${clientName}`;
      
      // Preparar o conteúdo do e-mail com mais informações
      const emailContent = message || 
        `Prezado cliente ${clientName},\n\nSegue em anexo a proposta de locação de veículos conforme solicitado.\n\nAtenciosamente,\nEquipe comercial`;
      
      // Enviar e-mail utilizando o serviço de e-mail
      const emailSent = await sendEmailWithOutlook(
        email, 
        emailSubject, 
        emailContent,
        // Aqui seria incluído o caminho do PDF ou o PDF em base64 
        // quando a funcionalidade de geração de PDF estiver implementada
      );
      
      if (emailSent) {
        // Registrar o envio bem-sucedido no histórico de ações
        try {
          const { createQuoteActionLog } = await import('@/integrations/supabase/services/quoteActionLogs');
          await createQuoteActionLog({
            quote_id: quoteId,
            quote_title: `Orçamento para ${clientName}`,
            action_type: 'EMAIL_SENT',
            user_id: getCurrentUser().id,
            user_name: getCurrentUser().name,
            details: { email_to: email }
          });
        } catch (logError) {
          console.warn("Erro ao registrar envio de e-mail no log:", logError);
        }
        
        toast({
          title: "E-mail enviado",
          description: `Orçamento enviado com sucesso para ${email}`
        });
        return true;
      } else {
        toast({
          title: "Falha no envio",
          description: "Não foi possível enviar o e-mail. Verifique as configurações.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Ocorreu um erro inesperado ao tentar enviar o e-mail",
        variant: "destructive"
      });
      return false;
    }
  };

  return { sendQuoteByEmail };
}
