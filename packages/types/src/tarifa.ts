export type TarifaModo = "km" | "zona";

export interface ZonaTarifa {
  id: string;
  tenant_id: string;
  nombre: string;
  precio: number;
  created_at?: string;
}

/** Configuracion de tarifas que consume la app del cliente. */
export interface TarifasTenant {
  tenant_id: string;
  nombre: string;
  modo: TarifaModo;
  base: number;
  por_km: number;
  zonas: ZonaTarifa[];
}

export const DEFAULT_TARIFA_BASE = 2;
export const DEFAULT_TARIFA_POR_KM = 0.5;

/**
 * Tasa de referencia usada como respaldo cuando todavia no hay una tasa
 * real registrada en la tabla `tasas_cambio` (BCV / DolarApi Venezuela).
 */
export const TASA_BCV_REFERENCIA = 36.5;

/** Tasa de cambio oficial (BCV) vigente. */
export interface TasaCambio {
  moneda: string;
  tasa: number;
  fecha: string;
  fuente: string | null;
  actualizado_at: string | null;
}

export function calcularTarifaKm(base: number, porKm: number, distanciaKm: number): number {
  return Math.round(Math.max(0, base + porKm * Math.max(0, distanciaKm)) * 100) / 100;
}

export function formatearUsd(valor: number): string {
  return `$${valor.toFixed(2)}`;
}

export function formatearBs(valorUsd: number, tasa = TASA_BCV_REFERENCIA): string {
  return `Bs. ${(valorUsd * tasa).toFixed(2)}`;
}
