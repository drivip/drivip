export interface Driver {
  id: string;
  name: string;
  slug: string;
  phone: string;
  rating: number;
  vehicle: { type: "auto" | "moto"; plate: string; model: string; color: string };
  status: "ONLINE" | "OCUPADO" | "OFFLINE" | "EN_RUTA";
  lat: number;
  lng: number;
  totalTrips: number;
  todayTrips: number;
  todayEarnings: number;
  lastActive: string;
}

export interface RideRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  origin: string;
  originLat: number;
  originLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  distance: number;
  estimatedFare: number;
  paymentMethod: string;
  rating: number;
  timestamp: string;
  priority: "normal" | "premium" | "vip";
}

export interface ActiveRide {
  id: string;
  driverId: string;
  driverName: string;
  clientName: string;
  origin: string;
  destination: string;
  status: "EN_CURSO" | "ESPERANDO" | "EN_RUTA";
  startedAt: string;
  estimatedArrival: string;
  fare: number;
}

export interface LineaStats {
  onlineDrivers: number;
  totalDrivers: number;
  activeRides: number;
  pendingRequests: number;
  completedToday: number;
  earningsToday: number;
  avgWaitTime: number;
  acceptanceRate: number;
}

export const lineaDrivers: Driver[] = [
  {
    id: "CH-001",
    name: "Alejandro Silva",
    slug: "silva-rides",
    phone: "+58 414-555-7283",
    rating: 4.8,
    vehicle: { type: "auto", plate: "AA123BC", model: "Chevrolet Aveo", color: "Blanco" },
    status: "ONLINE",
    lat: 10.4806,
    lng: -66.9036,
    totalTrips: 1247,
    todayTrips: 12,
    todayEarnings: 2450,
    lastActive: "Ahora",
  },
  {
    id: "CH-002",
    name: "Pedro Ramirez",
    slug: "ramirez-tours",
    phone: "+58 412-555-4521",
    rating: 4.7,
    vehicle: { type: "auto", plate: "BB456DE", model: "Toyota Corolla", color: "Gris" },
    status: "EN_RUTA",
    lat: 10.485,
    lng: -66.898,
    totalTrips: 892,
    todayTrips: 8,
    todayEarnings: 1850,
    lastActive: "Hace 2 min",
  },
  {
    id: "CH-003",
    name: "Luis Morales",
    slug: "morales-fast",
    phone: "+58 416-555-8934",
    rating: 4.6,
    vehicle: { type: "moto", plate: "CC789FG", model: "Yamaha FZ-25", color: "Negro" },
    status: "ONLINE",
    lat: 10.478,
    lng: -66.901,
    totalTrips: 1534,
    todayTrips: 15,
    todayEarnings: 3200,
    lastActive: "Ahora",
  },
  {
    id: "CH-004",
    name: "Carmen Herrera",
    slug: "herrera-ride",
    phone: "+58 424-555-1267",
    rating: 4.9,
    vehicle: { type: "moto", plate: "DD012HI", model: "Honda CB190", color: "Rojo" },
    status: "OCUPADO",
    lat: 10.483,
    lng: -66.902,
    totalTrips: 2103,
    todayTrips: 18,
    todayEarnings: 4100,
    lastActive: "Ahora",
  },
  {
    id: "CH-005",
    name: "Fernando Torres",
    slug: "torres-express",
    phone: "+58 414-555-3498",
    rating: 4.3,
    vehicle: { type: "auto", plate: "EE345JK", model: "Kia Morning", color: "Azul" },
    status: "OFFLINE",
    lat: 10.475,
    lng: -66.898,
    totalTrips: 456,
    todayTrips: 0,
    todayEarnings: 0,
    lastActive: "Hace 3 horas",
  },
  {
    id: "CH-006",
    name: "Ricardo Mendez",
    slug: "mendez-go",
    phone: "+58 412-555-7845",
    rating: 4.8,
    vehicle: { type: "auto", plate: "FF678LM", model: "Chevrolet Spark", color: "Verde" },
    status: "ONLINE",
    lat: 10.482,
    lng: -66.905,
    totalTrips: 1876,
    todayTrips: 10,
    todayEarnings: 2100,
    lastActive: "Ahora",
  },
  {
    id: "CH-007",
    name: "Ana Martinez",
    slug: "martinez-priority",
    phone: "+58 424-555-9123",
    rating: 4.5,
    vehicle: { type: "moto", plate: "GG901NO", model: "Suzuki Gixxer", color: "Blanco" },
    status: "ONLINE",
    lat: 10.479,
    lng: -66.904,
    totalTrips: 765,
    todayTrips: 6,
    todayEarnings: 1350,
    lastActive: "Ahora",
  },
  {
    id: "CH-008",
    name: "Jorge Garcia",
    slug: "garcia-delivery",
    phone: "+58 416-555-5678",
    rating: 4.4,
    vehicle: { type: "moto", plate: "HH234PQ", model: "Bajaj Pulsar", color: "Negro" },
    status: "EN_RUTA",
    lat: 10.486,
    lng: -66.899,
    totalTrips: 1102,
    todayTrips: 9,
    todayEarnings: 1950,
    lastActive: "Hace 1 min",
  },
];

export const lineaRideRequests: RideRequest[] = [
  {
    id: "REQ-001",
    clientName: "Sofia Ramirez",
    clientPhone: "+58 424-555-6789",
    origin: "Calle Principal, Barrio Obrero",
    originLat: 10.475,
    originLng: -66.898,
    destination: "CC Plaza Mayor, Nivel 2",
    destinationLat: 10.485,
    destinationLng: -66.898,
    distance: 4.3,
    estimatedFare: 310,
    paymentMethod: "Efectivo",
    rating: 5.0,
    timestamp: "10:45 AM",
    priority: "normal",
  },
  {
    id: "REQ-002",
    clientName: "Miguel Torres",
    clientPhone: "+58 412-555-2345",
    origin: "Av. Francisco de Miranda",
    originLat: 10.481,
    originLng: -66.904,
    destination: "Aeropuerto Maiquetia",
    destinationLat: 10.601,
    destinationLng: -66.991,
    distance: 28.5,
    estimatedFare: 850,
    paymentMethod: "Transferencia",
    rating: 4.8,
    timestamp: "10:42 AM",
    priority: "premium",
  },
  {
    id: "REQ-003",
    clientName: "Laura Diaz",
    clientPhone: "+58 414-555-1122",
    origin: "Res. Los Samanes, Piso 3",
    originLat: 10.482,
    originLng: -66.905,
    destination: "Hospital Central",
    destinationLat: 10.488,
    destinationLng: -66.892,
    distance: 6.2,
    estimatedFare: 420,
    paymentMethod: "Pago Movil",
    rating: 4.9,
    timestamp: "10:40 AM",
    priority: "vip",
  },
];

export const lineaActiveRides: ActiveRide[] = [
  {
    id: "CR-A01",
    driverId: "CH-002",
    driverName: "Pedro Ramirez",
    clientName: "Pedro Lopez",
    origin: "CC Plaza Mayor",
    destination: "Aeropuerto Maiquetia",
    status: "EN_RUTA",
    startedAt: "10:15 AM",
    estimatedArrival: "11:00 AM",
    fare: 850,
  },
  {
    id: "CR-A02",
    driverId: "CH-004",
    driverName: "Carmen Herrera",
    clientName: "Ana Martinez",
    origin: "Urb. Las Mercedes",
    destination: "Av. Principal, Res. Los Samanes",
    status: "ESPERANDO",
    startedAt: "10:38 AM",
    estimatedArrival: "10:45 AM",
    fare: 308,
  },
  {
    id: "CR-A03",
    driverId: "CH-008",
    driverName: "Jorge Garcia",
    clientName: "Carlos Hernandez",
    origin: "Av. Francisco de Miranda",
    destination: "CC Tolon, Nivel 1",
    status: "EN_CURSO",
    startedAt: "10:20 AM",
    estimatedArrival: "10:35 AM",
    fare: 220,
  },
];

export const lineaStats: LineaStats = {
  onlineDrivers: 5,
  totalDrivers: 8,
  activeRides: 3,
  pendingRequests: 3,
  completedToday: 45,
  earningsToday: 9850,
  avgWaitTime: 4.2,
  acceptanceRate: 94,
};
