
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Adicionar funções de formatação
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
