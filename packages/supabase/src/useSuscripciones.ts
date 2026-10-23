import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Suscripcion } from "@drivip/types";

interface SuscripcionesState {
  pendientes: Suscripcion[];
  todas: Suscripcion[];
  loading: boolean;
  error: string | null;
}

export function useSuscripciones() {
  const [state, setState] = useState<SuscripcionesState>({
    pendientes: [],
    todas: [],
    loading: true,
    error: null,
  });

  const fetchSuscripciones = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const [pendientesRes, todasRes] = await Promise.all([
      supabase
        .from("suscripciones")
        .select("*")
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("suscripciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const error = pendientesRes.error ?? todasRes.error;
    if (error) {
      setState({ pendientes: [], todas: [], loading: false, error: error.message });
    } else {
      setState({
        pendientes: (pendientesRes.data as Suscripcion[]) ?? [],
        todas: (todasRes.data as Suscripcion[]) ?? [],
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    void fetchSuscripciones();
  }, [fetchSuscripciones]);

  const verificarSuscripcion = useCallback(
    async (id: string, aprobado: boolean, verificadoPor: string) => {
      const { data: tenantId, error } = await supabase.rpc("verificar_suscripcion", {
        p_id: id,
        p_aprobado: aprobado,
        p_verificado_por: verificadoPor,
      });

      if (error || !tenantId) return false;

      await fetchSuscripciones();

      void supabase.functions
        .invoke("send-push", {
          body: {
            tenant_id: tenantId,
            title: aprobado ? "Suscripcion aprobada" : "Suscripcion rechazada",
            body: aprobado
              ? "Tu cuenta ya esta activa. Ya puedes recibir solicitudes."
              : "No pudimos verificar tu pago. Revisa el comprobante.",
            url: "/",
          },
        })
        .catch(() => undefined);

      return true;
    },
    [fetchSuscripciones]
  );

  return { ...state, verificarSuscripcion, refetch: fetchSuscripciones };
}
