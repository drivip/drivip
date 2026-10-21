export type CarreraEstado = "pendiente" | "aceptada" | "en_curso" | "completada" | "cancelada";
export type MetodoPago = "efectivo" | "pago_movil" | "transferencia";

export interface Carrera {
  id: string;
  tenant_id: string;
  conductor_id: string | null;
  cliente_id: string | null;
  origen_lat: number;
  origen_lng: number;
  origen_direccion: string | null;
  destino_lat: number | null;
  destino_lng: number | null;
  destino_direccion: string | null;
  distancia_km: number | null;
  duracion_min: number | null;
  precio: number | null;
  metodo_pago: MetodoPago | null;
  comprobante_url: string | null;
  tipo_servicio?: "viaje" | "delivery" | "compra";
  detalle_servicio?: string | null;
  estado: CarreraEstado;
  calificacion: number | null;
  comentario_calificacion: string | null;
  created_at: string;
  aceptada_at: string | null;
  llego_at?: string | null;
  completada_at: string | null;
  cancelada_at: string | null;
}
