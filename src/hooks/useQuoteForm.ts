
import { useState } from 'react';
import { useQuote } from '@/context/QuoteContext';

export const useQuoteForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { saveQuote: contextSaveQuote } = useQuote();
  
  const saveQuote = async () => {
    setIsLoading(true);
    
    try {
      const result = await contextSaveQuote();
      return result;
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { isLoading, saveQuote };
};
