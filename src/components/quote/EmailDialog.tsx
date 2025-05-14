
import React, { useState } from 'react';
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
import { getEmailConfig } from '@/lib/email-service';
import { Link } from 'react-router-dom';

interface EmailDialogProps {
  quoteId: string;
}

export const EmailDialog: React.FC<EmailDialogProps> = ({ quoteId }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { sendQuoteByEmail } = useQuote();

  // Verificar se existem configurações de email quando o diálogo é aberto
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      const config = await getEmailConfig();
      setConfigExists(!!config);
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
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o orçamento por e-mail",
        variant: "destructive"
      });
    }
    setSending(false);
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
          {configExists === false && (
            <DialogDescription className="text-destructive">
              Configurações de e-mail não encontradas. Configure o serviço de e-mail nas 
              <Link to="/settings" className="text-primary mx-1 underline">
                configurações do sistema
              </Link>
              antes de continuar.
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
              disabled={configExists === false}
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
              disabled={configExists === false}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSendEmail} 
            disabled={sending || !email || configExists === false}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
