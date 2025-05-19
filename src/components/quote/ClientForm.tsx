import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuoteContext } from '@/context/QuoteContext';
import { SqlClient } from '@/lib/sql-connection';
import { useToast } from '@/hooks/use-toast';

const clientSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phone: z.string().min(10, {
    message: "Telefone deve ter pelo menos 10 caracteres.",
  }),
})

interface ClientFormProps {
  offlineMode?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ offlineMode = false }) => {
  const { setClient, quote } = useQuoteContext();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: quote.client?.name || "",
      email: quote.client?.email || "",
      phone: quote.client?.phone || "",
    },
  })
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  function onSubmit(values: z.infer<typeof clientSchema>) {
    if (!isOnline && !offlineMode) {
      toast({
        title: "Sem conexão com a internet",
        description: "Você está offline. Por favor, conecte-se para salvar o cliente.",
        variant: "destructive",
      });
      return;
    }
    
    const newClient: SqlClient = {
      id: quote.client?.id || Math.random().toString(36).substring(7),
      name: values.name,
      email: values.email,
      phone: values.phone,
    };
    
    setClient(newClient);
    
    toast({
      title: "Cliente salvo",
      description: "Os dados do cliente foram salvos com sucesso.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do cliente" {...field} />
              </FormControl>
              <FormDescription>
                Este é o nome que será usado para identificar o cliente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Digite o email do cliente" {...field} />
              </FormControl>
              <FormDescription>
                Este é o email que será usado para enviar a proposta.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="Digite o telefone do cliente" {...field} />
              </FormControl>
              <FormDescription>
                Este é o telefone que será usado para entrar em contato com o cliente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Salvar Cliente</Button>
      </form>
    </Form>
  )
}

export default ClientForm;
