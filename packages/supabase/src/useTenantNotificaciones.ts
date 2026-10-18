import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { TenantNotificacion } from "@drivip/types";

export function useTenantNotificaciones(tenantId: string | null) {
  const [notificaciones, setNotificaciones] = useState<TenantNotificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("tenant_notificaciones")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!cancelled) {
          setNotificaciones((data as TenantNotificacion[]) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [tenantId]);

  const enviarNotificacion = useCallback(async (notif: Omit<TenantNotificacion, "id" | "created_at" | "enviada" | "enviada_at">) => {
    const { data, error } = await supabase
      .from("tenant_notificaciones")
      .insert({ ...notif, enviada: true, enviada_at: new Date().toISOString() })
      .select()
      .single();

    if (!error && data) {
      setNotificaciones((prev) => [data as TenantNotificacion, ...prev]);
    }
    return !error;
  }, []);

  const eliminarNotificacion = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("tenant_notificaciones")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    }
    return !error;
  }, []);

  return { notificaciones, loading, enviarNotificacion, eliminarNotificacion };
}
