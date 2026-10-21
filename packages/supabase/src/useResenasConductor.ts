import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResenaConductor } from "@drivip/types";
import { supabase } from "./client";

export function useResenasConductor(tenantId: string | null | undefined) {
  const [resenas, setResenas] = useState<ResenaConductor[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setResenas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_resenas_conductor", {
      p_tenant_id: tenantId,
    });
    if (rpcError) {
      setError(rpcError.message);
      setResenas([]);
    } else {
      setResenas(
        ((data as ResenaConductor[] | null) ?? []).map((resena) => ({
          ...resena,
          calificacion: Number(resena.calificacion),
        }))
      );
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`resenas-conductor-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "carreras",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = setTimeout(() => { void fetchAll(); }, 250);
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchAll]);

  const promedio = useMemo(() => {
    if (resenas.length === 0) return 0;
    return resenas.reduce((total, resena) => total + resena.calificacion, 0) / resenas.length;
  }, [resenas]);

  const distribucion = useMemo(
    () => [5, 4, 3, 2, 1].map((estrellas) => ({
      estrellas,
      cantidad: resenas.filter((resena) => Math.round(resena.calificacion) === estrellas).length,
    })),
    [resenas]
  );

  return {
    resenas,
    total: resenas.length,
    promedio,
    distribucion,
    loading,
    error,
    refetch: fetchAll,
  };
}
