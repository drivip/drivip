export const MOCK_DRIVER_PROFILE = {
  id: "drv-001",
  nombre: "José Rivera",
  cedula: "V-19.450.882",
  telefono: "+58 412-555-8910",
  email: "jose@drivip.app",
  slug: "josetaxi",
  avatar: null,
  vehiculo: {
    placa: "ABC-123",
    modelo: "Toyota Corolla",
    color: "Blanco",
    tipo: "CARRO",
    anio: 2022,
  },
  calificacion: 4.95,
  totalResenas: 128,
  fechaIngreso: "2025-01-15",
  plan: "PRO",
  suscripcionActiva: true,
  fechaVencimiento: "2026-10-15",
};

export const MOCK_VEHICLE_TYPES = [
  { id: "MOTO", label: "Moto", icon: "two_wheeler", color: "from-emerald-400 to-teal-600" },
  { id: "CARRO", label: "Carro", icon: "directions_car", color: "from-blue-500 to-indigo-600" },
  { id: "CAMIONETA", label: "Camioneta", icon: "local_shipping", color: "from-orange-500 to-red-600" },
];

export const MOCK_ZONE_PRICING = [
  { id: "1", zona: "Centro", base: 5.0, porKm: 1.5, color: "from-purple-500 to-indigo-600" },
  { id: "2", zona: "Este", base: 8.0, porKm: 2.0, color: "from-blue-500 to-cyan-500" },
  { id: "3", zona: "Oeste", base: 6.0, porKm: 1.8, color: "from-emerald-500 to-teal-600" },
  { id: "4", zona: "Sur", base: 7.0, porKm: 1.7, color: "from-orange-500 to-amber-500" },
];

export const MOCK_INCOMING_ORDER = {
  id: "ord-789",
  cliente: {
    nombre: "María Méndez",
    avatar: null,
    initial: "M",
    calificacion: 4.8,
    telefono: "+58 414-555-1234",
  },
  origen: {
    direccion: "Sambil Chacao",
    lat: 10.4920,
    lng: -66.8850,
  },
  destino: {
    direccion: "Plaza Santa Rosa",
    lat: 10.4806,
    lng: -66.9036,
  },
  distanciaKm: 3.5,
  duracionMin: 12,
  precioUsd: 5.00,
  precioBs: 288.25,
  metodoPago: "efectivo",
  notas: "Llevo maletas pequeñas",
};

export const MOCK_SCHEDULED_RIDES = [
  {
    id: "sch-1",
    cliente: "Pedro López",
    origen: "Los Ruices",
    destino: "Aeropuerto Maiquetía",
    fecha: "2026-09-17",
    hora: "06:30 AM",
    precio: 25.00,
    estado: "confirmada",
  },
  {
    id: "sch-2",
    cliente: "Ana Martínez",
    origen: "Altamira",
    destino: "CC Tolon",
    fecha: "2026-09-17",
    hora: "10:00 AM",
    precio: 7.50,
    estado: "pendiente",
  },
];

export const MOCK_CLIENTS = [
  { id: "1", nombre: "María García", telefono: "+58 412-1234567", carreras: 15, favorito: true, calificacion: 5.0 },
  { id: "2", nombre: "Pedro López", telefono: "+58 414-7654321", carreras: 8, favorito: false, calificacion: 4.7 },
  { id: "3", nombre: "Ana Martínez", telefono: "+58 416-9876543", carreras: 22, favorito: true, calificacion: 4.9 },
  { id: "4", nombre: "Carlos Gómez", telefono: "+58 414-239-1092", carreras: 5, favorito: false, calificacion: 4.5 },
  { id: "5", nombre: "Laura Sánchez", telefono: "+58 412-876-5432", carreras: 12, favorito: true, calificacion: 4.8 },
];

export const MOCK_ALLIES = [
  { id: "a1", nombre: "Farmacia La Abuela", tipo: "comercio", direccion: "Chacao", carreras: 32 },
  { id: "a2", nombre: "Restaurante El Buen Sabor", tipo: "comercio", direccion: "Las Mercedes", carreras: 18 },
  { id: "a3", nombre: "Hotel Caracas Palace", tipo: "hotel", direccion: "Altamira", carreras: 45 },
];

export const MOCK_HISTORY = [
  { id: "h1", fecha: "16 Sep 2026", cliente: "María Méndez", origen: "Sambil Chacao", destino: "Plaza Santa Rosa", precio: 5.00, duracion: "12 min", distancia: 3.5, calificacion: 5, metodoPago: "efectivo" },
  { id: "h2", fecha: "15 Sep 2026", cliente: "Pedro López", origen: "Los Ruices", destino: "Altamira", precio: 7.25, duracion: "18 min", distancia: 4.1, calificacion: 4, metodoPago: "pago_movil" },
  { id: "h3", fecha: "15 Sep 2026", cliente: "Ana Martínez", origen: "Catia", destino: "Parque Central", precio: 6.00, duracion: "22 min", distancia: 3.8, calificacion: 5, metodoPago: "efectivo" },
  { id: "h4", fecha: "14 Sep 2026", cliente: "Carlos Gómez", origen: "Chacaito", destino: "Las Mercedes", precio: 4.00, duracion: "10 min", distancia: 2.2, calificacion: 4, metodoPago: "pago_movil" },
  { id: "h5", fecha: "14 Sep 2026", cliente: "Laura Sánchez", origen: "Plaza Venezuela", destino: "CC Sambil", precio: 8.50, duracion: "25 min", distancia: 5.0, calificacion: 5, metodoPago: "efectivo" },
];

export const MOCK_EXPENSES = [
  { id: "e1", tipo: "Combustible", monto: 15.00, moneda: "USD", fecha: "2026-09-16", notas: "Gasolina Full" },
  { id: "e2", tipo: "Lavado", monto: 3.00, moneda: "USD", fecha: "2026-09-15", notas: "Lavado exterior" },
  { id: "e3", tipo: "Mantenimiento", monto: 45.00, moneda: "USD", fecha: "2026-09-10", notas: "Cambio de aceite" },
];

export const MOCK_DAILY_REPORT = {
  fecha: "16 Sep 2026",
  carrerasCompletadas: 8,
  ingresosUsd: 42.50,
  ingresosBs: 2450.12,
  gastosUsd: 18.00,
  gananciaNetaUsd: 24.50,
  calificacionPromedio: 4.95,
  horasOnline: "4h 15m",
  kmRecorridos: 32.5,
};

export const MOCK_WEEKLY_REPORT = {
  totalIngresosUsd: 285.75,
  totalCarreras: 52,
  promedioDiarioUsd: 40.82,
  mejorDia: { fecha: "Miércoles 10 Sep", ingresos: 62.00 },
};

export const MOCK_PAYMENT_METHODS = {
  pagoMovil: {
    banco: "0102",
    bancoNombre: "BDV",
    cedula: "V-19.450.882",
    telefono: "0412-5558910",
    activo: true,
  },
  zelle: {
    email: "jose.rivera@email.com",
    nombre: "José Rivera",
    activo: false,
  },
  efectivo: {
    activo: true,
    monedaAceptada: "USD + BS",
  },
};

export const MOCK_SAVED_ROUTES = [
  { id: "r1", nombre: "Casa", direccion: "Av. Principal, Chacao", lat: 10.4920, lng: -66.8850, icono: "home" },
  { id: "r2", nombre: "Base de Salida", direccion: "Plaza Venezuela", lat: 10.4850, lng: -66.8950, icono: "local_taxi" },
];

export const MOCK_REFERRAL_CODE = "DRIVIP-JOSE";
export const MOCK_REFERRALS_COUNT = 3;
