
export * from './services/clients';
export * from './services/quotes';
export * from './services/vehicles';
export * from './services/quoteVehicles';
export { checkSupabaseConnection } from './client';

// Exportações específicas para facilitar o uso
export { getQuoteActionLogs, saveQuoteToSupabase, getQuoteByIdFromSupabase, getQuotesFromSupabase, deleteQuoteFromSupabase } from './services/quotes';
export { getAllVehicles, getVehiclesFromSupabase } from './services/vehicles';
export { addVehicleToQuote, getQuoteVehicles } from './services/quoteVehicles';
export { saveClientToSupabase, getClientsFromSupabase, getClientByDocument, updateClientInSupabase } from './services/clients';
