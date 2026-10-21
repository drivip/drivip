export type TipoCupon = "porcentaje" | "monto";
export type EstadoCuponCliente = "disponible" | "usado" | "vencido";

export interface Cupon {
  id: string;
  tenant_id: string;
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  activo: boolean;
  valido_hasta: string | null;
  created_at: string;
  envios?: number;
  canjeados?: number;
}

export interface CuponCliente {
  envio_id: string;
  cupon_id: string;
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  valido_hasta: string | null;
  estado: EstadoCuponCliente;
  enviado_at: string;
  usado_at: string | null;
  conductor_tenant_id: string;
  conductor_nombre: string;
  conductor_slug: string | null;
  conductor_logo_url: string | null;
  conductor_telefono: string | null;
}
