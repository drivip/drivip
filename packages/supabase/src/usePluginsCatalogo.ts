import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";

export interface PluginCatalogo {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  activo: boolean;
  tenantCount: number;
}

interface UsoRow {
  plugin_nombre: string;
}

export function usePluginsCatalogo() {
  const [plugins, setPlugins] = useState<PluginCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [catalogoRes, usoRes] = await Promise.all([
      supabase.from("plugins_catalogo").select("*").order("nombre"),
      supabase.from("plugins_activos").select("plugin_nombre").eq("activo", true),
    ]);

    if (catalogoRes.error) {
      setError(catalogoRes.error.message);
      setPlugins([]);
      setLoading(false);
      return;
    }

    const counts = ((usoRes.data as UsoRow[]) ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.plugin_nombre] = (acc[row.plugin_nombre] ?? 0) + 1;
      return acc;
    }, {});

    setPlugins(
      ((catalogoRes.data as Omit<PluginCatalogo, "tenantCount">[]) ?? []).map((p) => ({
        ...p,
        tenantCount: counts[p.id] ?? 0,
      }))
    );
    setError(usoRes.error?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const togglePlugin = useCallback(async (id: string, activo: boolean) => {
    const { error: updateError } = await supabase
      .from("plugins_catalogo")
      .update({ activo })
      .eq("id", id);
    if (updateError) return { error: updateError.message };
    setPlugins((prev) => prev.map((p) => (p.id === id ? { ...p, activo } : p)));
    return { error: null };
  }, []);

  const crearPlugin = useCallback(async (input: { id: string; nombre: string; descripcion?: string; icono?: string }) => {
    const { data, error: insertError } = await supabase
      .from("plugins_catalogo")
      .insert({
        id: input.id.trim().toLowerCase().replace(/\s+/g, "_"),
        nombre: input.nombre.trim(),
        descripcion: input.descripcion?.trim() || null,
        icono: input.icono?.trim() || "extension",
      })
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    setPlugins((prev) => [...prev, { ...(data as Omit<PluginCatalogo, "tenantCount">), tenantCount: 0 }]);
    return { error: null };
  }, []);

  return { plugins, loading, error, refetch, togglePlugin, crearPlugin };
}
