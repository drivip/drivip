import type { ConductorRed } from "@drivip/types";
import type { Driver } from "../types/passenger";

const GRADIENTS = [
  "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
  "bg-gradient-to-br from-emerald-400 to-teal-600 text-white",
  "bg-gradient-to-br from-orange-400 to-red-500 text-white",
  "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
  "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
];

function hashIndex(key: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100000;
  return h % mod;
}

function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Convierte la info publica del conductor real en el modelo de la UI. */
export function toDriver(c: ConductorRed): Driver {
  const name = c.apodo?.trim() || c.nombre;
  const vehicle = [c.vehiculo_modelo, c.vehiculo_tipo].filter(Boolean).join(" ") || "Vehículo";
  const estado = c.disponibilidad ?? "disponible";
  const disponible = !c.pausado && c.suscripcion_activa && estado === "disponible";
  const vehicleType: Driver["vehicleType"] =
    c.vehiculo_tipo === "moto" || c.vehiculo_tipo === "camioneta" ? c.vehiculo_tipo : "carro";

  let availability = "Disponible ahora";
  if (c.pausado) {
    availability = "Pausado por el administrador";
  } else if (estado === "pausa_30") {
    const minutos = c.disponibilidad_hasta
      ? Math.max(0, Math.ceil((new Date(c.disponibilidad_hasta).getTime() - Date.now()) / 60000))
      : 30;
    availability = minutos > 0 ? `Se desocupa en ${minutos} min` : "Disponible ahora";
  } else if (estado === "personalizado") {
    availability = c.disponibilidad_nota || "No disponible";
  } else if (estado === "ocupado") {
    availability = "Ocupado";
  }

  const paymentData = {
    pagoMovil: {
      activo: c.pago_movil_activo ?? true,
      banco: c.pago_movil_banco ?? null,
      cedula: c.pago_movil_cedula ?? null,
      telefono: c.pago_movil_telefono ?? null,
    },
    zelle: {
      activo: c.zelle_activo ?? false,
      email: c.zelle_email ?? null,
      nombre: c.zelle_nombre ?? null,
    },
    efectivo: {
      activo: c.efectivo_activo ?? true,
    },
  };

  const paymentMethods: string[] = [];
  if (paymentData.efectivo.activo) paymentMethods.push("Efectivo");
  if (paymentData.pagoMovil.activo) paymentMethods.push("Pago Móvil");
  if (paymentData.zelle.activo) paymentMethods.push("Zelle");
  if (paymentMethods.length === 0) paymentMethods.push("Efectivo");

  return {
    id: c.conductor_tenant_id,
    slug: c.slug,
    name,
    initials: initialsOf(name),
    vehicle,
    vehicleColor: c.vehiculo_color || "Sin color",
    vehicleType,
    plate: c.vehiculo_placa || "S/P",
    rating: c.calificacion ?? 0,
    reviews: Number(c.total_resenas ?? 0),
    trips: 0,
    status: disponible ? "available" : "busy",
    availability,
    paymentMethods,
    paymentData,
    phone: c.telefono || "",
    whatsapp: (c.telefono || "").replace(/[^\d]/g, ""),
    ci: "",
    bank: "",
    color: GRADIENTS[hashIndex(c.conductor_tenant_id, GRADIENTS.length)],
    isVip: c.suscripcion_activa,
    image: c.logo_url || undefined,
  };
}
