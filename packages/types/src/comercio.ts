export interface Producto {
  id: string;
  tenant_id: string;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
  created_at: string;
}

export type PedidoComercioEstado = "pendiente" | "preparando" | "en_camino" | "entregado" | "cancelado";

export interface PedidoComercioItem {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface PedidoComercio {
  id: string;
  tenant_id: string;
  cliente_nombre: string;
  telefono: string | null;
  direccion_entrega: string | null;
  items: PedidoComercioItem[];
  total: number;
  estado: PedidoComercioEstado;
  created_at: string;
}
