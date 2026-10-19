export interface DireccionCliente {
  id: string;
  cliente_id: string;
  alias: string;
  direccion: string;
  referencia: string | null;
  lat: number | null;
  lng: number | null;
  icono: string;
  predeterminada: boolean;
  created_at: string;
}

export type ReservaEstado = "pendiente" | "confirmada" | "completada" | "cancelada";

export interface ReservaCliente {
  id: string;
  cliente_id: string;
  conductor_tenant_id: string | null;
  origen: string;
  destino: string;
  origen_lat: number | null;
  origen_lng: number | null;
  destino_lat: number | null;
  destino_lng: number | null;
  fecha_hora: string;
  notas: string | null;
  precio_usd: number | null;
  estado: ReservaEstado;
  created_at: string;
}
