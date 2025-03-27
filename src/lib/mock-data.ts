export type Client = {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string;
  email?: string;
};

export type VehicleGroup = {
  id: string;
  name: string;
  revisionKm: number;
  tireKm: number;
};

// Vehicle type
export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  value: number;
  groupId: string;
  isUsed: boolean;
  plateNumber?: string;   // Add plate number for used vehicles
  color?: string;         // Add color for used vehicles
  odometer?: number;      // Add odometer for used vehicles
};

export const clients: Client[] = [
  {
    id: '1',
    name: 'João da Silva',
    type: 'PF',
    document: '123.456.789-00',
    email: 'joao.silva@email.com',
  },
  {
    id: '2',
    name: 'Empresa ABC Ltda',
    type: 'PJ',
    document: '00.123.456/0001-90',
    email: 'contato@empresaabc.com.br',
  },
  {
    id: '3',
    name: 'Maria Souza',
    type: 'PF',
    document: '987.654.321-11',
  },
];

export const vehicleGroups: VehicleGroup[] = [
  {
    id: 'A',
    name: 'Grupo A',
    revisionKm: 10000,
    tireKm: 40000,
  },
  {
    id: 'B',
    name: 'Grupo B',
    revisionKm: 15000,
    tireKm: 45000,
  },
  {
    id: 'C',
    name: 'Grupo C',
    revisionKm: 20000,
    tireKm: 50000,
  },
];

export const vehicles: Vehicle[] = [
  {
    id: '1',
    brand: 'Fiat',
    model: 'Uno',
    year: 2022,
    value: 50000,
    groupId: 'A',
    isUsed: false,
  },
  {
    id: '2',
    brand: 'Volkswagen',
    model: 'Gol',
    year: 2023,
    value: 55000,
    groupId: 'A',
    isUsed: false,
  },
  {
    id: '3',
    brand: 'Hyundai',
    model: 'HB20',
    year: 2021,
    value: 60000,
    groupId: 'B',
    isUsed: false,
  },
  {
    id: '4',
    brand: 'Chevrolet',
    model: 'Onix',
    year: 2022,
    value: 65000,
    groupId: 'B',
    isUsed: false,
  },
  {
    id: '5',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    value: 120000,
    groupId: 'C',
    isUsed: false,
  },
  {
    id: '6',
    brand: 'Honda',
    model: 'Civic',
    year: 2022,
    value: 110000,
    groupId: 'C',
    isUsed: false,
  },
];

export const getVehicleGroupById = (id: string) => {
  return vehicleGroups.find(group => group.id === id);
};
