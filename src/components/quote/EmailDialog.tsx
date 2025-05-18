
import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuote } from '@/context/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { getEmailConfig } from '@/lib/email/config-service';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface EmailDialogProps {
  quoteId: string;
  quoteTitle?: string;
}

export const EmailDialog: React.FC<EmailDialogProps> = ({ quoteId, quoteTitle }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { sendQuoteByEmail } = useQuote();

  // Verificar se existem configurações de email quando o diálogo é aberto
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      try {
        setLoading(true);
        const config = await getEmailConfig();
        console.log("Configurações de e-mail:", config ? "Encontradas" : "Não encontradas");
        setConfigExists(!!config && !!config.password);
        
        // Mensagem padrão para começar
        if (!message) {
          setMessage("Prezado cliente,\n\nSegue em anexo a proposta de locação de veículos conforme solicitado.\n\nAtenciosamente,\nEquipe comercial");
        }
      } catch (error) {
        console.error("Erro ao verificar configurações de e-mail:", error);
        setConfigExists(false);
      } finally {
        setLoading(false);
      }
    }
    setDialogOpen(open);
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "E-mail obrigatório",
        description: "Digite o e-mail do destinatário",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      console.log(`Tentando enviar orçamento ${quoteId} para ${email} com título: ${quoteTitle || 'Orçamento'}`);
      const success = await sendQuoteByEmail(quoteId, email, message);
      
      if (success) {
        toast({
          title: "E-mail enviado",
          description: "Orçamento enviado com sucesso"
        });
        setDialogOpen(false);
        setEmail('');
        setMessage('');
      } else {
        console.error("Falha no envio do e-mail");
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível enviar o orçamento por e-mail. Verifique as configurações nas preferências do sistema.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao tentar enviar o e-mail. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Mail size={16} />
          <span>Enviar por E-mail</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Orçamento por E-mail</DialogTitle>
          {loading ? (
            <DialogDescription className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando configurações de e-mail...
            </DialogDescription>
          ) : configExists === false ? (
            <DialogDescription className="text-destructive">
              Configurações de e-mail não encontradas ou incompletas. Configure o serviço de e-mail nas {' '}
              <Link to="/configuracoes" className="text-primary mx-1 underline">
                configurações do sistema
              </Link>
              {' '}antes de continuar.
            </DialogDescription>
          ) : (
            <DialogDescription>
              Insira o endereço de e-mail para enviar este orçamento.
              {quoteTitle && <span className="block mt-1 font-medium">{quoteTitle}</span>}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com.br"
              className="col-span-3"
              disabled={loading || configExists === false || sending}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Segue em anexo o orçamento conforme solicitado."
              className="col-span-3"
              rows={5}
              disabled={loading || configExists === false || sending}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={sending || loading}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSendEmail}
            disabled={sending || loading || !email || configExists === false}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
