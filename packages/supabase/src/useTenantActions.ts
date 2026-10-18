import { useCallback } from "react";
import { supabase } from "./client";

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

  return { togglePausa, cambiarPlan, toggleModulo, actualizarVehiculo, toggleActivo };
}
