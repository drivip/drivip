export interface Cliente {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalTrips: number;
  lastTrip: string;
  rating: number;
  notes: string;
  totalSpent: number;
}

export const clientesData: Cliente[] = [
  {
    id: "CL-001",
    name: "Maria Gonzalez",
    phone: "+58 414-555-1234",
    address: "Av. Libertador, Edif. 23, Caracas",
    totalTrips: 47,
    lastTrip: "Hoy, 2:30 PM",
    rating: 5.0,
    notes: "Prefiere Toyota, siempre paga en efectivo",
    totalSpent: 16450,
  },
  {
    id: "CL-002",
    name: "Pedro Lopez",
    phone: "+58 412-555-5678",
    address: "CC Plaza Mayor, Nivel 2, Caracas",
    totalTrips: 32,
    lastTrip: "Ayer, 6:15 PM",
    rating: 4.8,
    notes: "Viaja al aeropuerto frecuentemente",
    totalSpent: 12800,
  },
  {
    id: "CL-003",
    name: "Ana Martinez",
    phone: "+58 424-555-9012",
    address: "Urb. Las Mercedes, Calle 8, Caracas",
    totalTrips: 28,
    lastTrip: "Hoy, 11:00 AM",
    rating: 4.9,
    notes: "Paga por Pago Movil siempre",
    totalSpent: 8400,
  },
  {
    id: "CL-004",
    name: "Carlos Hernandez",
    phone: "+58 416-555-3456",
    address: "Av. Principal, Res. Los Samanes, Caracas",
    totalTrips: 15,
    lastTrip: "08 Octubre 2025",
    rating: 4.5,
    notes: "Cliente nuevo, viaja los viernes",
    totalSpent: 4500,
  },
  {
    id: "CL-005",
    name: "Laura Rodriguez",
    phone: "+58 414-555-7890",
    address: "CC Tolon, Nivel 1, Caracas",
    totalTrips: 8,
    lastTrip: "05 Octubre 2025",
    rating: 4.7,
    notes: "Paga en efectivo, viaja con mascota",
    totalSpent: 2800,
  },
  {
    id: "CL-006",
    name: "Miguel Torres",
    phone: "+58 412-555-2345",
    address: "Av. Francisco de Miranda, Caracas",
    totalTrips: 5,
    lastTrip: "01 Octubre 2025",
    rating: 4.6,
    notes: "Prefiere moto express",
    totalSpent: 1500,
  },
  {
    id: "CL-007",
    name: "Sofia Ramirez",
    phone: "+58 424-555-6789",
    address: "Calle Principal, Barrio Obrero, Caracas",
    totalTrips: 3,
    lastTrip: "28 Septiembre 2025",
    rating: 5.0,
    notes: "",
    totalSpent: 900,
  },
];

export const clienteStats = {
  total: 7,
  active: 5,
  topClient: "Maria Gonzalez",
  topClientTrips: 47,
};
