export interface Aliado {
  id: string;
  name: string;
  rating: number;
  vehicle: string;
  distance: number;
  commission: number;
  status: "ONLINE" | "OFFLINE" | "OCUPADO";
  tripsPassed: number;
  earnedThisMonth: number;
  lat: number;
  lng: number;
}

export const aliadosData: Aliado[] = [
  {
    id: "AL-001",
    name: "Pedro Ramirez",
    rating: 4.7,
    vehicle: "Toyota Corolla 2020",
    distance: 2.3,
    commission: 10,
    status: "ONLINE",
    tripsPassed: 8,
    earnedThisMonth: 560,
    lat: 10.482,
    lng: -66.905,
  },
  {
    id: "AL-002",
    name: "Luis Morales",
    rating: 4.6,
    vehicle: "Hyundai Accent 2019",
    distance: 3.1,
    commission: 10,
    status: "ONLINE",
    tripsPassed: 5,
    earnedThisMonth: 350,
    lat: 10.478,
    lng: -66.901,
  },
  {
    id: "AL-003",
    name: "Carmen Herrera",
    rating: 4.9,
    vehicle: "Yamaha FZ-25 2022",
    distance: 1.8,
    commission: 12,
    status: "OCUPADO",
    tripsPassed: 12,
    earnedThisMonth: 840,
    lat: 10.485,
    lng: -66.908,
  },
  {
    id: "AL-004",
    name: "Fernando Torres",
    rating: 4.3,
    vehicle: "Kia Morning 2021",
    distance: 4.5,
    commission: 8,
    status: "OFFLINE",
    tripsPassed: 2,
    earnedThisMonth: 140,
    lat: 10.475,
    lng: -66.898,
  },
  {
    id: "AL-005",
    name: "Ricardo Mendez",
    rating: 4.8,
    vehicle: "Chevrolet Spark 2020",
    distance: 1.2,
    commission: 10,
    status: "ONLINE",
    tripsPassed: 15,
    earnedThisMonth: 1050,
    lat: 10.483,
    lng: -66.902,
  },
];

export const aliadoStats = {
  total: 5,
  online: 3,
  totalTripsPassed: 42,
  totalEarned: 2940,
  avgCommission: 10,
};
