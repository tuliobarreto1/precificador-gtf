
// Central exports for Supabase services
import { supabase, checkSupabaseConnection } from './core/client';
import { getVehiclesFromSupabase, createOrUpdateVehicle, findVehicleByPlate, findVehicleByBrandModel } from './services/vehicles';
import { saveClientToSupabase, getClientByDocument, getClientsFromSupabase } from './services/clients';
import { saveQuoteToSupabase, getQuotesFromSupabase, getQuoteByIdFromSupabase } from './services/quotes';
import { getQuoteVehicles, addVehicleToQuote } from './services/quoteVehicles';

export {
  // Core
  supabase,
  checkSupabaseConnection,
  
  // Vehicles
  getVehiclesFromSupabase,
  createOrUpdateVehicle,
  findVehicleByPlate,
  findVehicleByBrandModel,
  
  // Clients
  saveClientToSupabase,
  getClientByDocument,
  getClientsFromSupabase,
  
  // Quotes
  saveQuoteToSupabase,
  getQuotesFromSupabase,
  getQuoteByIdFromSupabase,
  
  // Quote Vehicles
  getQuoteVehicles,
  addVehicleToQuote
};
