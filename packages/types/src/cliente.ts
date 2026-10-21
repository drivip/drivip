export interface RedCliente {
  id: string;
  cliente_id: string;
  conductor_tenant_id: string;
  apodo: string | null;
  favorito: boolean;
  notificaciones_activas: boolean;
  agregado_at: string;
}

/** Conductor (tenant) que pertenece a la red del cliente. */
export interface ConductorRed {
  conductor_tenant_id: string;
  slug: string;
  nombre: string;
  logo_url: string | null;
  ciudad: string | null;
  telefono: string | null;
  vehiculo_tipo: string | null;
  vehiculo_placa: string | null;
  vehiculo_modelo: string | null;
  vehiculo_color: string | null;
  calificacion: number | null;
  total_resenas?: number | null;
  pausado: boolean;
  suscripcion_activa: boolean;
  disponibilidad?: "disponible" | "ocupado" | "pausa_30" | "personalizado" | null;
  disponibilidad_nota?: string | null;
  disponibilidad_hasta?: string | null;
  pago_movil_activo?: boolean | null;
  pago_movil_banco?: string | null;
  pago_movil_cedula?: string | null;
  pago_movil_telefono?: string | null;
  zelle_activo?: boolean | null;
  zelle_email?: string | null;
  zelle_nombre?: string | null;
  efectivo_activo?: boolean | null;
  apodo: string | null;
  favorito: boolean;
  agregado_at: string;
}

export interface Cliente {
  id: string;
  tenant_id: string | null;
  profile_id: string | null;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  total_carreras: number;
  created_at: string;
}
