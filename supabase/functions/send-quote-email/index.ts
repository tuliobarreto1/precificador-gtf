
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  quoteId: string;
  quoteTitle: string;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  totalValue: number;
  contractMonths: number;
  monthlyKm: number;
  vehicles: Array<{
    brand: string;
    model: string;
    plateNumber?: string;
    monthlyValue: number;
  }>;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recebida solicitação para enviar e-mail de orçamento");
    const emailData: EmailRequest = await req.json();
    
    const {
      recipientEmail,
      recipientName,
      quoteId,
      quoteTitle,
      message,
      totalValue,
      contractMonths,
      monthlyKm,
      vehicles,
      senderName,
      senderEmail,
      senderPhone
    } = emailData;

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "E-mail do destinatário é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Enviando e-mail para ${recipientEmail}`);

    // Formatar a tabela de veículos
    const vehiclesTable = vehicles.map(vehicle => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${vehicle.brand} ${vehicle.model}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${vehicle.plateNumber || "N/A"}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${vehicle.monthlyValue.toLocaleString('pt-BR')}</td>
      </tr>
    `).join("");

    // Criar o HTML do email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0099ff;">
          <h1 style="color: #0066cc; margin: 0;">Proposta de Locação</h1>
          <p style="margin-top: 5px; color: #666;">${quoteTitle || "Orçamento de Frota"}</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Prezado(a) ${recipientName || "Cliente"},</p>
          
          ${message ? `<p>${message}</p><br/>` : ""}
          
          <p>Temos o prazer de apresentar nossa proposta de locação de frota com as seguintes condições:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Prazo de contrato:</strong> ${contractMonths} meses</p>
            <p><strong>Quilometragem mensal:</strong> ${monthlyKm.toLocaleString('pt-BR')} km/mês</p>
            <p><strong>ID do orçamento:</strong> ${quoteId}</p>
          </div>
          
          <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 8px;">Veículos inclusos</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Veículo</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Placa</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Valor Mensal</th>
              </tr>
            </thead>
            <tbody>
              ${vehiclesTable}
            </tbody>
            <tfoot>
              <tr style="background-color: #f2f2f2;">
                <td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Total Mensal:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>R$ ${totalValue.toLocaleString('pt-BR')}</strong></td>
              </tr>
            </tfoot>
          </table>
          
          <p style="margin-top: 30px;">Para mais informações ou esclarecer dúvidas, não hesite em me contatar.</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            <p><strong>${senderName}</strong><br>
            E-mail: ${senderEmail}
            ${senderPhone ? `<br>Telefone: ${senderPhone}` : ""}
            </p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;">
          <p>Este e-mail foi enviado automaticamente pelo sistema de orçamentos.</p>
        </div>
      </div>
    `;

    // Enviar o email usando o Resend
    const { data, error } = await resend.emails.send({
      from: "Orçamentos <onboarding@resend.dev>", // Atualize para seu domínio verificado quando estiver em produção
      to: [recipientEmail],
      subject: `Proposta de Locação: ${quoteTitle || "Orçamento de Frota"}`,
      html: html,
      reply_to: senderEmail,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("E-mail enviado com sucesso:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Erro na função de envio de e-mail:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
