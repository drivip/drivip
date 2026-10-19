import { useCallback } from "react";
import { supabase } from "./client";
import type { MetodoPagoSuscripcion } from "@drivip/types";

export interface RegistrarPagoInput {
  monto: number;
  moneda?: string;
  metodo_pago: MetodoPagoSuscripcion;
  referencia?: string | null;
  meses?: number;
  verificado_por?: string | null;
}

export function useTenantActions() {
  const togglePausa = useCallback(async (tenantId: string, pausado: boolean, motivo?: string) => {
    const { error } = await supabase
      .from("tenants")
      .update({ pausado, pausado_motivo: pausado ? (motivo ?? null) : null })
      .eq("id", tenantId);
    return !error;
  }, []);

  const cambiarPlan = useCallback(async (tenantId: string, plan: string) => {
    const { error } = await supabase
      .from("tenants")
      .update({ plan })
      .eq("id", tenantId);
    return !error;
  }, []);

  const toggleModulo = useCallback(async (tenantId: string, modulosActivos: string[]) => {
    const { error } = await supabase
      .from("tenants")
      .update({ modulos_activos: modulosActivos })
      .eq("id", tenantId);
    return !error;
  }, []);

  const actualizarVehiculo = useCallback(async (
    tenantId: string,
    vehiculo: { vehiculo_tipo?: string; vehiculo_placa?: string; vehiculo_modelo?: string; vehiculo_color?: string }
  ) => {
    const { error } = await supabase
      .from("tenants")
      .update(vehiculo)
      .eq("id", tenantId);
    return !error;
  }, []);

  const toggleActivo = useCallback(async (tenantId: string, activo: boolean) => {
    const { error } = await supabase
      .from("tenants")
      .update({ suscripcion_activa: activo })
      .eq("id", tenantId);
    return !error;
  }, []);

  const registrarPago = useCallback(async (tenantId: string, input: RegistrarPagoInput) => {
    const now = new Date();
    const fin = new Date(now);
    fin.setMonth(fin.getMonth() + (input.meses ?? 1));

    const { error: pagoError } = await supabase.from("suscripciones").insert({
      tenant_id: tenantId,
      monto: input.monto,
      moneda: input.moneda ?? "VES",
      metodo_pago: input.metodo_pago,
      referencia: input.referencia ?? null,
      estado: "verificado",
      verificado_por: input.verificado_por ?? null,
      fecha_inicio: now.toISOString(),
      fecha_fin: fin.toISOString(),
    });

    if (pagoError) return false;

    const { error: tenantError } = await supabase
      .from("tenants")
      .update({
        suscripcion_activa: true,
        fecha_vencimiento: fin.toISOString(),
      })
      .eq("id", tenantId);

    return !tenantError;
  }, []);

  return { togglePausa, cambiarPlan, toggleModulo, actualizarVehiculo, toggleActivo, registrarPago };
}
