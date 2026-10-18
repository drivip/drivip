export interface Tarifa {
  id: string;
  name: string;
  baseFare: number;
  perKm: number;
  minimum: number;
  icon: string;
  active: boolean;
}

export const tarifasData: Tarifa[] = [
  {
    id: "TAXI",
    name: "Taxi (Auto)",
    baseFare: 150,
    perKm: 25,
    minimum: 200,
    icon: "directions_car",
    active: true,
  },
  {
    id: "MOTO",
    name: "Moto Express",
    baseFare: 100,
    perKm: 15,
    minimum: 120,
    icon: "two_wheeler",
    active: true,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    baseFare: 250,
    perKm: 35,
    minimum: 400,
    icon: "star",
    active: false,
  },
  {
    id: "AEROPUERTO",
    name: "Aeropuerto",
    baseFare: 500,
    perKm: 30,
    minimum: 600,
    icon: "flight",
    active: true,
  },
  {
    id: "PAQUETE",
    name: "Paquete",
    baseFare: 80,
    perKm: 10,
    minimum: 100,
    icon: "inventory_2",
    active: false,
  },
];

export interface Recargo {
  id: string;
  name: string;
  percentage: number;
  condition: string;
  active: boolean;
}

export const recargosData: Recargo[] = [
  {
    id: "NOCHE",
    name: "Nocturno",
    percentage: 20,
    condition: "Despues de las 10:00 PM",
    active: true,
  },
  {
    id: "PICO",
    name: "Horario Pico",
    percentage: 15,
    condition: "7-9 AM y 5-7 PM",
    active: true,
  },
  {
    id: "LLUVIA",
    name: "Lluvia",
    percentage: 10,
    condition: "Activacion manual",
    active: false,
  },
  {
    id: "LARGO",
    name: "Largo Alcance",
    percentage: -5,
    condition: "Carreras > 15km",
    active: true,
  },
  {
    id: "FRECUENTE",
    name: "Cliente Frecuente",
    percentage: -10,
    condition: "Clientes con > 20 carreras",
    active: true,
  },
];

export interface ZonaEspecial {
  id: string;
  name: string;
  fixedFare: number;
  description: string;
  active: boolean;
}

export const zonasData: ZonaEspecial[] = [
  {
    id: "CENTRO",
    name: "Centro Caracas",
    fixedFare: 200,
    description: "Radio 3km desde Plaza Bolivar",
    active: true,
  },
  {
    id: "AEROPUERTO",
    name: "Aeropuerto Maiquetia",
    fixedFare: 600,
    description: "Zona definida por coordenadas",
    active: true,
  },
  {
    id: "INDUSTRIAL",
    name: "Zona Industrial",
    fixedFare: 180,
    description: "Catia, La Yaguara",
    active: false,
  },
];
