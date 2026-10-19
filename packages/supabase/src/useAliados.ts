import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Aliado, AliadoTipo } from "@drivip/types";

export interface NuevoAliado {
  nombre: string;
  tipo: AliadoTipo;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export function useAliados(tenantId: string | null | undefined) {
  const [aliados, setAliados] = useState<Aliado[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setAliados([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("aliados")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setAliados([]);
    } else {
      setAliados((data as Aliado[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const addAliado = useCallback(
    async (input: NuevoAliado): Promise<{ error: string | null }> => {
      if (!tenantId) return { error: "Tenant no disponible" };
      const { data, error: insertError } = await supabase
        .from("aliados")
        .insert({
          tenant_id: tenantId,
          nombre: input.nombre.trim(),
          tipo: input.tipo,
          direccion: input.direccion?.trim() || null,
          telefono: input.telefono?.trim() || null,
          email: input.email?.trim() || null,
        })
        .select()
        .single();
      if (insertError) return { error: insertError.message };
      setAliados((prev) => [data as Aliado, ...prev]);
      return { error: null };
    },
    [tenantId]
  );

  return { aliados, loading, error, refetch, addAliado };
}
