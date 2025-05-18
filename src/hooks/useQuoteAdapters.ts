
import { SavedQuote, User } from '@/context/types/quoteTypes';

export function useQuoteAdapters(
  canEditQuoteById: (quoteId: string) => boolean,
  canDeleteQuoteById: (quoteId: string) => boolean
) {
  // Adaptadores para as funções canEditQuote e canDeleteQuote para atender à interface esperada
  const canEditQuoteAdapter = (quote: SavedQuote, user: User): boolean => {
    return canEditQuoteById(quote.id);
  };

  const canDeleteQuoteAdapter = (quote: SavedQuote, user: User): boolean => {
    return canDeleteQuoteById(quote.id);
  };

  return {
    canEditQuoteAdapter,
    canDeleteQuoteAdapter
  };
}
