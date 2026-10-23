export type AliadoTipo = "tienda" | "restaurante" | "hotel" | "oficina" | "otro";

export interface Aliado {
  id: string;
  tenant_id: string;
  nombre: string;
  tipo: AliadoTipo;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  carreras: number;
  activo: boolean;
  created_at: string;
}

export type ReferidoEstado = "pendiente" | "activo" | "inactivo";

export interface Referido {
  id: string;
  referidor_tenant_id: string;
  referido_tenant_id: string;
  codigo: string;
  estado: ReferidoEstado;
  plan_referido?: string | null;
  monto_mensual_referido?: number;
  created_at: string;
  activado_at?: string | null;
  desactivado_at?: string | null;
}
