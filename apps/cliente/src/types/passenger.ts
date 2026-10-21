export interface Driver {
  id: string;
  slug: string;
  name: string;
  initials: string;
  vehicle: string;
  vehicleColor: string;
  vehicleType: "carro" | "moto" | "camioneta";
  plate: string;
  rating: number;
  reviews: number;
  trips: number;
  status: "available" | "busy" | "offline";
  availability: string;
  paymentMethods: string[];
  phone: string;
  whatsapp: string;
  ci: string;
  bank: string;
  color: string;
  isVip: boolean;
  image?: string;
}

export interface TripHistory {
  id: string;
  date: string;
  time: string;
  type: string;
  origin: string;
  destination: string;
  driverName: string;
  driverInitials: string;
  driverVehicle: string;
  driverRating: number;
  priceUsd: number;
  priceBs: number;
  paymentMethod: string;
  paymentRef?: string;
  driverColor: string;
}

export interface SavedAddress {
  id: string;
  name: string;
  address: string;
  reference?: string;
  lat?: number | null;
  lng?: number | null;
  icon: string;
  iconBg: string;
  iconColor: string;
  isDefault?: boolean;
  driverNote?: string;
  badge?: string;
  badgeColor?: string;
}

export interface Reservation {
  id: string;
  title: string;
  dateLabel: string;
  dayShort: string;
  dayNum: string;
  time: string;
  origin: string;
  destination: string;
  driverName?: string;
  driverInitials?: string;
  driverVehicle?: string;
  driverStatus?: "confirmed" | "pending";
  driverRating?: number;
  priceUsd: number;
  paymentMethods: string[];
  countdown?: string;
  driversNotified?: number;
  status: "confirmed" | "pending";
}

export type PassengerScreen =
  | "home"
  | "drivers"
  | "addresses"
  | "history"
  | "reservations"
  | "profile"
  | "ride"
  | "add";

export type RideStatus =
  | "idle"
  | "requesting"
  | "waiting"
  | "arriving"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Stop {
  address: string;
  lat: number;
  lng: number;
}

export interface ActiveRide {
  id: string;
  tenantId: string;
  status: RideStatus;
  originAddress: string;
  originCoords: [number, number];
  destinationAddress: string;
  destinationCoords: [number, number] | null;
  stops: Stop[];
  route: [number, number][];
  distanceKm: number;
  durationMin: number;
  priceUsd: number;
  priceBs: number;
  paymentMethod: "usd" | "bs" | "pmovil";
  conductorName: string;
  conductorInitials: string;
  conductorPhone: string;
  conductorVehicle: string;
  conductorPlate: string;
  conductorRating: number;
  conductorColor: string;
  conductorImage?: string;
}

export interface Destination {
  address: string;
  lat: number;
  lng: number;
}
