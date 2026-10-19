import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { TarifaModo, TarifasTenant, ZonaTarifa } from "@drivip/types";
import { DEFAULT_TARIFA_BASE, DEFAULT_TARIFA_POR_KM } from "@drivip/types";

/**
 * Lee la tarifa publica de un conductor (modo, base, $/km y zonas)
 * mediante la RPC get_tarifas_tenant. Usada por la app del cliente.
 */
export function useTarifasTenant(tenantId: string | null | undefined) {
  const [tarifas, setTarifas] = useState<TarifasTenant | null>(null);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setTarifas(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .rpc("get_tarifas_tenant", { p_tenant_id: tenantId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError(rpcError.message);
          setTarifas(null);
        } else {
          const raw = data as TarifasTenant | null;
          setTarifas(raw ? {
            ...raw,
            base: Number(raw.base ?? DEFAULT_TARIFA_BASE),
            por_km: Number(raw.por_km ?? DEFAULT_TARIFA_POR_KM),
            zonas: (raw.zonas ?? []).map((z) => ({ ...z, precio: Number(z.precio) })),
          } : null);
          setError(null);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tenantId]);

  return { tarifas, loading, error };
}

/** Zonas de tarifa del propio conductor (CRUD desde el panel). */
export function useZonas(tenantId: string | null | undefined) {
  const [zonas, setZonas] = useState<ZonaTarifa[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setZonas([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("zonas")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    setZonas(((data as ZonaTarifa[]) ?? []).map((z) => ({ ...z, precio: Number(z.precio) })));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const insertarZona = useCallback(async (nombre: string, precio: number) => {
    if (!tenantId) return null;
    const { data, error } = await supabase
      .from("zonas")
      .insert({ tenant_id: tenantId, nombre, precio })
      .select()
      .single();
    if (error) return null;
    const zona = { ...(data as ZonaTarifa), precio: Number((data as ZonaTarifa).precio) };
    setZonas((prev) => [...prev, zona]);
    return zona;
  }, [tenantId]);

  const actualizarZona = useCallback(async (id: string, cambios: Partial<Pick<ZonaTarifa, "nombre" | "precio">>) => {
    const { error } = await supabase.from("zonas").update(cambios).eq("id", id);
    if (!error) {
      setZonas((prev) => prev.map((z) => (z.id === id ? { ...z, ...cambios } : z)));
    }
    return !error;
  }, []);

  const eliminarZona = useCallback(async (id: string) => {
    const { error } = await supabase.from("zonas").delete().eq("id", id);
    if (!error) setZonas((prev) => prev.filter((z) => z.id !== id));
    return !error;
  }, []);

  return { zonas, loading, refetch, insertarZona, actualizarZona, eliminarZona };
}

/** Guarda el modo/base/$km del conductor autenticado via RPC segura. */
export async function guardarTarifas(modo: TarifaModo, base: number, porKm: number) {
  const { data, error } = await supabase.rpc("actualizar_tarifas_propias", {
    p_modo: modo,
    p_base: base,
    p_por_km: porKm,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: Boolean(data), error: null };
}
