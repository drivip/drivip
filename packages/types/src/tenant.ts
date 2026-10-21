import type { TarifaModo } from "./tarifa";

export type TenantType = "conductor";

export type VehiculoTipo = "moto" | "carro" | "camioneta";

export interface Tenant {
  id: string;
  slug: string;
  type: TenantType;
  nombre: string;
  email: string | null;
  telefono: string | null;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
  suscripcion_activa: boolean;
  plan: string;
  fecha_vencimiento: string | null;
  cedula: string | null;
  ciudad: string | null;
  direccion: string | null;
  vehiculo_tipo: VehiculoTipo | null;
  vehiculo_placa: string | null;
  vehiculo_modelo: string | null;
  vehiculo_color: string | null;
  calificacion: number | null;
  total_clientes: number;
  total_carreras: number;
  pausado: boolean;
  pausado_motivo: string | null;
  modulos_activos: string[];
  codigo_referido?: string | null;
  tarifa_modo: TarifaModo;
  tarifa_base: number;
  tarifa_por_km: number;
  created_at: string;
  updated_at: string;
}

/** Subconjunto publico de un tenant, expuesto por la RPC get_tenant_by_slug. */
export interface PublicTenant {
  id: string;
  slug: string;
  nombre: string;
  type: TenantType;
  logo_url: string | null;
  ciudad: string | null;
  vehiculo_tipo: VehiculoTipo | null;
  vehiculo_placa: string | null;
  vehiculo_modelo: string | null;
  vehiculo_color: string | null;
  calificacion: number | null;
  pausado: boolean;
  suscripcion_activa: boolean;
}
