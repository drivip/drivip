import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@drivip/supabase";
import type { Carrera } from "@drivip/types";

export function useCarreraRealtime(
  carreraId: string | null,
  onEstadoChange: (carrera: Carrera) => void
) {
  const callbackRef = useRef(onEstadoChange);
  callbackRef.current = onEstadoChange;

  useEffect(() => {
    if (!carreraId) return;

    const channel = supabase
      .channel(`carrera-${carreraId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "carreras",
          filter: `id=eq.${carreraId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Carrera);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carreraId]);
}
