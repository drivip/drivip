export type SuscripcionEstado = "pendiente" | "verificado" | "rechazado";
export type MetodoPagoSuscripcion = "pago_movil" | "transferencia" | "efectivo";

export interface Suscripcion {
  id: string;
  tenant_id: string;
  monto: number;
  moneda: string;
  metodo_pago: MetodoPagoSuscripcion;
  referencia: string | null;
  banco_origen: string | null;
  comprobante_url: string | null;
  estado: SuscripcionEstado;
  verificado_por: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}
