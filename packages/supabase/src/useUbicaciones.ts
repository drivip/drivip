import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./client";
import type { Ubicacion } from "@drivip/types";

export function useUbicaciones(conductorId: string) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("ubicaciones")
      .select("*")
      .eq("conductor_id", conductorId)
      .order("timestamp", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!cancelled) {
          setUbicaciones((data as Ubicacion[]) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [conductorId]);

  const reportarUbicacion = useCallback(async (ubicacion: {
    conductor_id: string;
    tenant_id: string;
    lat: number;
    lng: number;
    velocidad?: number;
    direccion?: number;
    carrera_id?: string;
  }) => {
    const { error } = await supabase.from("ubicaciones").insert({
      ...ubicacion,
      timestamp: new Date().toISOString(),
    });
    return !error;
  }, []);

  return { ubicaciones, loading, reportarUbicacion };
}

export function useRealtimeUbicacionConductor(
  conductorId: string,
  onUbicacion: (ubicacion: Ubicacion) => void
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
          table: "ubicaciones",
          filter: `conductor_id=eq.${conductorId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Ubicacion);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conductorId]);
}
