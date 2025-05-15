
import React from 'react';
import { useToast as useToastOriginal } from '@/components/ui/toast';
import { ToastActionElement } from '@/components/ui/toast';

type ToastProps = {
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

export const toast = ({ title, description, action, variant = 'default' }: ToastProps) => {
  // Criar log para rastreamento
  console.log(`🔔 Exibindo toast: ${title}`, {
    título: title,
    descrição: description,
    variante: variant
  });
  
  // Implementação da função toast
  const { toast: showToast } = useToastOriginal();
  
  return showToast({
    title,
    description,
    action,
    variant
  });
};

// Re-exportar o hook useToast original mas sem renomear
export const useToast = useToastOriginal;
