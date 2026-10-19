import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Referido } from "@drivip/types";

export function useReferidos(tenantId: string | null | undefined) {
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setReferidos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("referidos")
      .select("*")
      .eq("referidor_tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setReferidos([]);
    } else {
      setReferidos((data as Referido[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { referidos, loading, error, refetch };
}

/** Registra el código de referido para el conductor autenticado (post-signup). */
export async function registrarReferido(codigo: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("registrar_referido", { p_codigo: codigo });
  return { error: error?.message ?? null };
}
