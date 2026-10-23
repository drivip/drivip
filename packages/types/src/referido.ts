export type EstadoComisionReferido = "pendiente" | "pagado" | "anulado";

export interface ConfigReferidos {
  id: number;
  descuento_por_referido_pct: number;
  meta_referidos_gratis: number;
  comision_socio_pct: number;
  precio_plan_estandar: number;
  precio_plan_profesional: number;
  precio_plan_premium: number;
  actualizado_at: string;
}

export interface CuentaReferidos {
  tenant_id: string;
  plan: string;
  precio_plan: number;
  referidos_activos: number;
  descuento_pct: number;
  monto_descuento: number;
  total_mensual: number;
  es_gratis: boolean;
  es_socio: boolean;
  socio_desde: string | null;
  meta_referidos_gratis: number;
  comision_socio_pct: number;
  comisiones_pendientes: number;
  comisiones_pagadas: number;
  comisiones_totales: number;
  pago_movil_banco: string | null;
  pago_movil_cedula: string | null;
  pago_movil_telefono: string | null;
}

export interface ReferidoDetalle {
  id: string;
  codigo: string;
  estado: "pendiente" | "activo" | "inactivo";
  created_at: string;
  activado_at: string | null;
  plan: string | null;
  monto_mensual: number;
  referido_nombre: string;
  suscripcion_activa: boolean;
  fecha_vencimiento: string | null;
}

export interface ComisionReferido {
  id: string;
  periodo: string;
  base_monto: number;
  porcentaje: number;
  monto: number;
  estado: EstadoComisionReferido;
  created_at: string;
  pagado_at: string | null;
  referido_nombre: string;
}

export interface PagoReferido {
  id: string;
  monto: number;
  metodo: string;
  referencia: string | null;
  notas: string | null;
  created_at: string;
}

export interface ProgramaReferidos {
  config: ConfigReferidos;
  cuenta: CuentaReferidos;
  referidos: ReferidoDetalle[];
  comisiones: ComisionReferido[];
  pagos: PagoReferido[];
}

export interface AdminReferidoRow {
  id: string;
  nombre: string;
  codigo_referido: string | null;
  plan: string;
  referidos_total: number;
  referidos_activos: number;
  socio_drivip: boolean;
  socio_desde: string | null;
  precio_plan: number;
  descuento_pct: number;
  monto_descuento: number;
  total_mensual: number;
  comisiones_pendientes: number;
  comisiones_pagadas: number;
  comisiones_totales: number;
  pago_movil_banco: string | null;
  pago_movil_cedula: string | null;
  pago_movil_telefono: string | null;
  ultimo_pago_at: string | null;
}

export interface AdminReferidoDetalle {
  id: string;
  referidor_tenant_id: string;
  referidor_nombre: string;
  referido_tenant_id: string;
  referido_nombre: string;
  codigo: string;
  estado: "pendiente" | "activo" | "inactivo";
  plan: string;
  monto_mensual: number;
  created_at: string;
  activado_at: string | null;
}
