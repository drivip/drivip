import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { PluginActivo } from "@drivip/types";

export function usePlugins(tenantId: string) {
  const [plugins, setPlugins] = useState<PluginActivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("plugins_activos")
      .select("*")
      .eq("tenant_id", tenantId)
      .then(({ data }) => {
        if (!cancelled) {
          setPlugins((data as PluginActivo[]) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [tenantId]);

  const togglePlugin = useCallback(async (pluginNombre: string, activo: boolean) => {
    const { error } = await supabase
      .from("plugins_activos")
      .upsert({
        tenant_id: tenantId,
        plugin_nombre: pluginNombre,
        activo,
        configuracion: {},
        ...(activo ? { activado_at: new Date().toISOString() } : { desactivado_at: new Date().toISOString() }),
      }, { onConflict: "tenant_id,plugin_nombre" });

    if (!error) {
      setPlugins((prev) => {
        const existing = prev.find((p) => p.plugin_nombre === pluginNombre);
        if (existing) {
          return prev.map((p) =>
            p.plugin_nombre === pluginNombre ? { ...p, activo } : p
          );
        }
        return [...prev, { id: crypto.randomUUID(), tenant_id: tenantId, plugin_nombre: pluginNombre, activo, configuracion: {}, activado_at: new Date().toISOString(), desactivado_at: null }];
      });
    }
    return !error;
  }, [tenantId]);

  return { plugins, loading, togglePlugin };
}
