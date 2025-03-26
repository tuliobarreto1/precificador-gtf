
export type VehicleGroup = {
  id: string;
  name: string;
  description: string;
  revisionKm: number;
  revisionCost: number;
  tireKm: number;
  tireCost: number;
};

export type Vehicle = {
  id: string;
  model: string;
  brand: string;
  year: number;
  value: number;
  groupId: string;
  isUsed: boolean;
  fipeCode?: string;
};

export type Client = {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ'; // PF = Person, PJ = Company
  address?: string;
  phone?: string;
  email?: string;
};

export type Quote = {
  id: string;
  clientId: string;
  vehicleId: string;
  contractMonths: number;
  monthlyKm: number;
  operationSeverity: 1 | 2 | 3 | 4 | 5 | 6;
  hasTracking: boolean;
  createdAt: string;
  depreciationCost: number;
  maintenanceCost: number;
  trackingCost: number;
  totalCost: number;
  costPerKm: number;
};

// Mock vehicle groups (A-VC)
export const vehicleGroups: VehicleGroup[] = [
  { id: 'A', name: 'Grupo A', description: 'Carros compactos', revisionKm: 10000, revisionCost: 300, tireKm: 40000, tireCost: 1200 },
  { id: 'B', name: 'Grupo B', description: 'Carros subcompactos', revisionKm: 10000, revisionCost: 350, tireKm: 40000, tireCost: 1400 },
  { id: 'C', name: 'Grupo C', description: 'Carros médios', revisionKm: 10000, revisionCost: 400, tireKm: 40000, tireCost: 1600 },
  { id: 'D', name: 'Grupo D', description: 'Carros médios premium', revisionKm: 10000, revisionCost: 500, tireKm: 35000, tireCost: 2000 },
  { id: 'E', name: 'Grupo E', description: 'Carros executivos', revisionKm: 5000, revisionCost: 700, tireKm: 30000, tireCost: 2400 },
  // Add more groups as needed...
];

// Mock vehicles
export const vehicles: Vehicle[] = [
  { id: '1', model: 'Onix', brand: 'Chevrolet', year: 2023, value: 75000, groupId: 'B', isUsed: false },
  { id: '2', model: 'HB20', brand: 'Hyundai', year: 2023, value: 78000, groupId: 'B', isUsed: false },
  { id: '3', model: 'Polo', brand: 'Volkswagen', year: 2023, value: 89000, groupId: 'C', isUsed: false },
  { id: '4', model: 'Civic', brand: 'Honda', year: 2023, value: 140000, groupId: 'D', isUsed: false },
  { id: '5', model: 'Corolla', brand: 'Toyota', year: 2023, value: 142000, groupId: 'D', isUsed: false },
  { id: '6', model: 'Compass', brand: 'Jeep', year: 2023, value: 175000, groupId: 'E', isUsed: false },
  { id: '7', model: 'Corolla', brand: 'Toyota', year: 2021, value: 110000, groupId: 'D', isUsed: true },
  { id: '8', model: 'Hilux', brand: 'Toyota', year: 2023, value: 230000, groupId: 'VC', isUsed: false },
];

// Mock clients
export const clients: Client[] = [
  { id: '1', name: 'Empresa ABC Ltda', document: '12.345.678/0001-90', type: 'PJ', address: 'Av. Paulista, 1000', phone: '11 5555-1234', email: 'contato@empresaabc.com' },
  { id: '2', name: 'João Silva', document: '123.456.789-00', type: 'PF', address: 'Rua das Flores, 123', phone: '11 98765-4321', email: 'joao.silva@email.com' },
  { id: '3', name: 'Empresa XYZ S.A.', document: '98.765.432/0001-10', type: 'PJ', address: 'Av. Brasil, 500', phone: '11 5555-9876', email: 'contato@empresaxyz.com' },
];

// Mock quotes
export const quotes: Quote[] = [
  {
    id: '1',
    clientId: '1',
    vehicleId: '5',
    contractMonths: 24,
    monthlyKm: 3000,
    operationSeverity: 3,
    hasTracking: true,
    createdAt: '2023-05-15T10:30:00Z',
    depreciationCost: 3200,
    maintenanceCost: 800,
    trackingCost: 50,
    totalCost: 4050,
    costPerKm: 1.35
  },
  {
    id: '2',
    clientId: '2',
    vehicleId: '2',
    contractMonths: 12,
    monthlyKm: 1500,
    operationSeverity: 2,
    hasTracking: false,
    createdAt: '2023-06-22T14:45:00Z',
    depreciationCost: 1900,
    maintenanceCost: 450,
    trackingCost: 0,
    totalCost: 2350,
    costPerKm: 1.57
  },
];

// Helper function to get vehicle group by ID
export const getVehicleGroupById = (groupId: string): VehicleGroup | undefined => {
  return vehicleGroups.find(group => group.id === groupId);
};

// Helper function to get vehicle by ID
export const getVehicleById = (vehicleId: string): Vehicle | undefined => {
  return vehicles.find(vehicle => vehicle.id === vehicleId);
};

// Helper function to get client by ID
export const getClientById = (clientId: string): Client | undefined => {
  return clients.find(client => client.id === clientId);
};
