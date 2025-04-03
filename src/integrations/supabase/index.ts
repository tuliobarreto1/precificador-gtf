
// Central exports for Supabase services
import { supabase, checkSupabaseConnection } from './client';
import { getVehiclesFromSupabase, createOrUpdateVehicle, findVehicleByPlate, findVehicleByBrandModel, getAllVehicles, getVehiclesFromLocavia } from './services/vehicles';
import { saveClientToSupabase, getClientByDocument, getClientsFromSupabase, deleteClientFromSupabase, updateClientInSupabase } from './services/clients';
import { saveQuoteToSupabase, getQuotesFromSupabase, getQuoteByIdFromSupabase, deleteQuoteFromSupabase } from './services/quotes';
import { getQuoteVehicles, addVehicleToQuote } from './services/quoteVehicles';
import { getVehicleGroups, getVehicleGroupById } from './services/vehicleGroups';
import { createQuoteActionLog, getQuoteActionLogs } from './services/quoteActionLogs';
import { fetchProtectionPlans, fetchProtectionPlanDetails, updateProtectionPlan } from './services/protectionPlans';

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
  deleteClientFromSupabase,
  updateClientInSupabase,
  
  // Quotes
  saveQuoteToSupabase,
  getQuotesFromSupabase,
  getQuoteByIdFromSupabase,
  deleteQuoteFromSupabase,
  
  // Quote Vehicles
  getQuoteVehicles,
  addVehicleToQuote,
  
  // Quote Action Logs
  createQuoteActionLog,
  getQuoteActionLogs,
  
  // Protection Plans
  fetchProtectionPlans,
  fetchProtectionPlanDetails,
  updateProtectionPlan
};
