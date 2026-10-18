import { useState, useCallback } from "react";
import { useRealtimeUbicacionConductor } from "@drivip/supabase";
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

  useRealtimeUbicacionConductor(conductorId ?? "", handleUbicacion);

  return { location, lastUpdated };
}
