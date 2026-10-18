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

  useEffect(() => {
    let cancelled = false;

    const fetchSuscripciones = async () => {
      const { data, error } = await supabase
        .from("suscripciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setState({ pendientes: [], todas: [], loading: false, error: error.message });
      } else {
        const all = (data as Suscripcion[]) ?? [];
        const pendientes = all.filter((s) => s.estado === "pendiente");
        setState({ pendientes, todas: all, loading: false, error: null });
      }
    };

    fetchSuscripciones();
    return () => { cancelled = true; };
  }, []);

  const verificarSuscripcion = useCallback(async (id: string, aprobado: boolean, verificadoPor: string) => {
    const updates: Record<string, unknown> = {
      estado: aprobado ? "verificado" : "rechazado",
      verificado_por: verificadoPor,
    };

    if (aprobado) {
      const now = new Date();
      const fechaFin = new Date(now);
      fechaFin.setDate(fechaFin.getDate() + 30);
      updates.fecha_inicio = now.toISOString();
      updates.fecha_fin = fechaFin.toISOString();
    }

    const { error } = await supabase
      .from("suscripciones")
      .update(updates)
      .eq("id", id);

    if (!error) {
      setState((prev) => ({
        ...prev,
        pendientes: prev.pendientes.filter((s) => s.id !== id),
        todas: prev.todas.map((s) =>
          s.id === id ? { ...s, ...updates } as Suscripcion : s
        ),
      }));

      if (aprobado) {
        const sub = state.pendientes.find((s) => s.id === id);
        if (sub) {
          await supabase
            .from("tenants")
            .update({
              suscripcion_activa: true,
              fecha_vencimiento: updates.fecha_fin,
            })
            .eq("id", sub.tenant_id);
        }
      }
    }
    return !error;
  }, [state.pendientes]);

  return { ...state, verificarSuscripcion };
}
