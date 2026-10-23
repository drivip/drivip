import { useCallback } from "react";
import { supabase } from "./client";
import type { MetodoPagoSuscripcion } from "@drivip/types";

export interface RegistrarPagoInput {
  monto: number;
  moneda?: string;
  metodo_pago: MetodoPagoSuscripcion;
  referencia?: string | null;
  banco_origen?: string | null;
  meses?: number;
  verificado_por?: string | null;
}

export interface PerfilConductorInput {
  nombre: string;
  telefono?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  vehiculo_tipo?: string | null;
  vehiculo_placa?: string | null;
  vehiculo_modelo?: string | null;
  vehiculo_color?: string | null;
  logo_url?: string | null;
}

export interface AccionResult {
  ok: boolean;
  error: string | null;
  url?: string | null;
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
      banco_origen: input.banco_origen ?? null,
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

  const actualizarPerfil = useCallback(
    async (perfil: PerfilConductorInput): Promise<AccionResult> => {
      const { error } = await supabase.rpc("actualizar_perfil_conductor", {
        p_nombre: perfil.nombre,
        p_telefono: perfil.telefono ?? null,
        p_ciudad: perfil.ciudad ?? null,
        p_direccion: perfil.direccion ?? null,
        p_vehiculo_tipo: perfil.vehiculo_tipo ?? null,
        p_vehiculo_placa: perfil.vehiculo_placa ?? null,
        p_vehiculo_modelo: perfil.vehiculo_modelo ?? null,
        p_vehiculo_color: perfil.vehiculo_color ?? null,
        p_logo_url: perfil.logo_url ?? null,
      });

      return { ok: !error, error: error?.message ?? null };
    },
    []
  );

  const subirImagenPerfil = useCallback(
    async (tenantId: string, blob: Blob): Promise<AccionResult> => {
      const extension =
        blob.type === "image/jpeg" ? "jpg" : blob.type === "image/png" ? "png" : "webp";
      const path = `${tenantId}/avatar.${extension}`;

      const obsoletas = ["webp", "jpg", "png"]
        .filter((item) => item !== extension)
        .map((item) => `${tenantId}/avatar.${item}`);
      void supabase.storage.from("perfiles").remove(obsoletas);

      const { error } = await supabase.storage.from("perfiles").upload(path, blob, {
        upsert: true,
        contentType: blob.type || "image/webp",
        cacheControl: "3600",
      });

      if (error) return { ok: false, error: error.message, url: null };

      const { data } = supabase.storage.from("perfiles").getPublicUrl(path);
      return {
        ok: true,
        error: null,
        url: `${data.publicUrl}?v=${Date.now()}`,
      };
    },
    []
  );

  return {
    togglePausa,
    cambiarPlan,
    toggleModulo,
    actualizarVehiculo,
    toggleActivo,
    registrarPago,
    actualizarPerfil,
    subirImagenPerfil,
  };
}
