import { useState, useCallback, useEffect } from "react";
import { supabase, useRealtimeUbicacionConductor } from "@drivip/supabase";
import type { Ubicacion } from "@drivip/types";

export function useConductorLocation(conductorId: string | null) {
  const [location, setLocation] = useState<{ lat: number; lng: number; bearing: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleUbicacion = useCallback((ubicacion: Ubicacion) => {
    setLocation({
      lat: ubicacion.lat,
      lng: ubicacion.lng,
      bearing: ubicacion.direccion ?? 0,
    });
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!conductorId) {
      setLocation(null);
      setLastUpdated(null);
      return;
    }

    let cancelled = false;
    void supabase
      .from("ubicaciones")
      .select("*")
      .eq("conductor_id", conductorId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const ubicacion = data as Ubicacion;
        setLocation({
          lat: ubicacion.lat,
          lng: ubicacion.lng,
          bearing: ubicacion.direccion ?? 0,
        });
        setLastUpdated(new Date(ubicacion.timestamp));
      });

    return () => {
      cancelled = true;
    };
  }, [conductorId]);

  useRealtimeUbicacionConductor(conductorId ?? "", handleUbicacion);

  return { location, lastUpdated };
}
