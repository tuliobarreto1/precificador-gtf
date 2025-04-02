
// Central exports for Supabase services
import { supabase, checkSupabaseConnection } from './client';
import { getVehiclesFromSupabase, createOrUpdateVehicle, findVehicleByPlate, findVehicleByBrandModel, getAllVehicles, getVehiclesFromLocavia } from './services/vehicles';
import { saveClientToSupabase, getClientByDocument, getClientsFromSupabase } from './services/clients';
import { saveQuoteToSupabase, getQuotesFromSupabase, getQuoteByIdFromSupabase } from './services/quotes';
import { getQuoteVehicles, addVehicleToQuote } from './services/quoteVehicles';
import { getVehicleGroups, getVehicleGroupById } from './services/vehicleGroups';

export {
  // Core
  supabase,
  checkSupabaseConnection,
  
  // Vehicles
  getVehiclesFromSupabase,
  createOrUpdateVehicle,
  findVehicleByPlate,
  findVehicleByBrandModel,
  getAllVehicles,
  getVehiclesFromLocavia,
  
  // Vehicle Groups
  getVehicleGroups,
  getVehicleGroupById,
  
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
