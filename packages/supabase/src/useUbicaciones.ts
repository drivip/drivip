import { useCallback, useEffect, useRef } from "react";
import { supabase } from "./client";
import type { UbicacionActual } from "@drivip/types";

export interface ReportarUbicacionInput {
  lat: number;
  lng: number;
  velocidad?: number | null;
  direccion?: number | null;
  carrera_id?: string | null;
}

/**
 * Reporta la posicion del conductor al RPC del servidor.
 * El servidor decide cuando guardar historial (12 s / 40 m) y actualiza
 * una unica fila en conductor_ubicacion_actual.
 */
export function useReportarUbicacion() {
  const reportarUbicacion = useCallback(async (ubicacion: ReportarUbicacionInput) => {
    const { error } = await supabase.rpc("reportar_ubicacion", {
      p_lat: ubicacion.lat,
      p_lng: ubicacion.lng,
      p_velocidad: ubicacion.velocidad ?? null,
      p_direccion: ubicacion.direccion ?? null,
      p_carrera_id: ubicacion.carrera_id ?? null,
    });
    return !error;
  }, []);

  return { reportarUbicacion };
}

/** @deprecated Usar useReportarUbicacion. */
export const useUbicaciones = useReportarUbicacion;

export function useRealtimeUbicacionConductor(
  conductorId: string,
  onUbicacion: (ubicacion: UbicacionActual) => void
) {
  const callbackRef = useRef(onUbicacion);
  callbackRef.current = onUbicacion;

  useEffect(() => {
    if (!conductorId) return;

    const channel = supabase
      .channel(`ubicacion-${conductorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conductor_ubicacion_actual",
          filter: `conductor_id=eq.${conductorId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          callbackRef.current(payload.new as UbicacionActual);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conductorId]);
}
