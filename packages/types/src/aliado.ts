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

export type ReferidoEstado = "pendiente" | "activo";

export interface Referido {
  id: string;
  referidor_tenant_id: string;
  referido_tenant_id: string;
  codigo: string;
  estado: ReferidoEstado;
  created_at: string;
}
