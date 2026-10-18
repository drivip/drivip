export interface ChoferProfile {
  id: string;
  name: string;
  rif: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  avatarUrl: string | null;
  vehicle: {
    type: "auto" | "moto";
    plate: string;
    model: string;
    year: number;
    color: string;
  };
  contract: {
    status: "ACTIVE" | "PAST_DUE" | "WARNING" | "SUSPENDED";
    plan: string;
    startDate: string;
    endDate: string;
    monthlyFee: number;
    paymentMethod: string;
    daysOverdue?: number;
  };
  plugins: {
    DISPATCH: boolean;
    REFERRALS: boolean;
    DELIVERY: boolean;
    CUSTOM_DOMAIN: boolean;
  };
  referralCode: string;
  referralDiscount: number;
  activeReferrals: number;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  totalClients: number;
  todayEarnings: number;
  todayTrips: number;
  weekEarnings: number;
  monthEarnings: number;
  activeTimeMinutes: number;
}

export const choferProfile: ChoferProfile = {
  id: "CH-001",
  name: "Alejandro Silva",
  rif: "V-22194830",
  slug: "silva-rides",
  email: "alejandro.silva@gmail.com",
  phone: "+58 414-555-7283",
  city: "Caracas",
  address: "Av. Libertador, Edif. 45, Piso 2, Caracas",
  avatarUrl: null,
  vehicle: {
    type: "auto",
    plate: "AA123BC",
    model: "Chevrolet Aveo",
    year: 2018,
    color: "Blanco",
  },
  contract: {
    status: "ACTIVE",
    plan: "Premium (Base + DISPATCH + REFERRALS)",
    startDate: "2024-03-15",
    endDate: "2025-10-02",
    monthlyFee: 105.0,
    paymentMethod: "Pago Movil",
  },
  plugins: {
    DISPATCH: true,
    REFERRALS: true,
    DELIVERY: false,
    CUSTOM_DOMAIN: false,
  },
  referralCode: "SILVA-2024",
  referralDiscount: 5.0,
  activeReferrals: 3,
  isOnline: true,
  rating: 4.8,
  totalTrips: 1247,
  totalClients: 89,
  todayEarnings: 2450,
  todayTrips: 12,
  weekEarnings: 16800,
  monthEarnings: 68200,
  activeTimeMinutes: 390,
};

export const choferStats = {
  today: {
    earnings: 2450,
    trips: 12,
    avgPerTrip: 204,
    activeHours: 6.5,
    cancelledTrips: 1,
    acceptanceRate: 92,
  },
  week: {
    earnings: 16800,
    trips: 78,
    bestDay: "Sabado",
    bestDayEarnings: 3200,
  },
  month: {
    earnings: 68200,
    trips: 312,
    avgRating: 4.8,
    totalClients: 89,
    pendingPayments: 350,
  },
};
