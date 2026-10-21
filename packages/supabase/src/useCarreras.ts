import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./client";
import type { Carrera } from "@drivip/types";

interface CarrerasState {
  carreras: Carrera[];
  loading: boolean;
  error: string | null;
}

export function useCarreras(conductorId?: string) {
  const [state, setState] = useState<CarrerasState>({
    carreras: [],
    loading: true,
    error: null,
  });
  const carrerasRef = useRef<Carrera[]>([]);
  carrerasRef.current = state.carreras;

  useEffect(() => {
    let cancelled = false;
    let query = supabase.from("carreras").select("*").order("created_at", { ascending: false });
    if (conductorId) query = query.eq("conductor_id", conductorId);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setState({ carreras: [], loading: false, error: error.message });
      } else {
        setState({ carreras: (data as Carrera[]) ?? [], loading: false, error: null });
      }
    });

    return () => { cancelled = true; };
  }, [conductorId]);

  // Mantiene la lista sincronizada cuando el cliente crea o actualiza
  // una carrera (nuevas solicitudes, aceptadas, completadas, etc.).
  useEffect(() => {
    if (!conductorId) return;

    const channel = supabase
      .channel(`carreras-live-${conductorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carreras", filter: `conductor_id=eq.${conductorId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            setState((s) => ({ ...s, carreras: s.carreras.filter((c) => c.id !== old.id) }));
            return;
          }
          const row = payload.new as Carrera;
          setState((s) => {
            const exists = s.carreras.some((c) => c.id === row.id);
            const carreras = exists
              ? s.carreras.map((c) => (c.id === row.id ? row : c))
              : [row, ...s.carreras];
            return { ...s, carreras, error: null };
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conductorId]);

  const createCarrera = useCallback(async (carrera: Omit<Carrera, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("carreras")
      .insert(carrera)
      .select()
      .single();

    if (error) return null;
    return data as Carrera;
  }, []);

  const updateCarreraEstado = useCallback(async (id: string, estado: Carrera["estado"]) => {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { estado };
    if (estado === "aceptada") updates.aceptada_at = now;
    if (estado === "completada") updates.completada_at = now;
    if (estado === "cancelada") updates.cancelada_at = now;

    const anterior = carrerasRef.current.find((c) => c.id === id);

    setState((s) => ({
      ...s,
      carreras: s.carreras.map((c) =>
        c.id === id ? ({ ...c, ...updates } as Carrera) : c
      ),
    }));

    const { error } = await supabase
      .from("carreras")
      .update(updates)
      .eq("id", id);

    if (error && anterior) {
      setState((s) => ({
        ...s,
        carreras: s.carreras.map((c) => (c.id === id ? anterior : c)),
        error: error.message,
      }));
    }

    return !error;
  }, []);

  const marcarLlegadaCarrera = useCallback(async (id: string) => {
    const llego_at = new Date().toISOString();
    const anterior = carrerasRef.current.find((c) => c.id === id);

    setState((s) => ({
      ...s,
      carreras: s.carreras.map((c) => (c.id === id ? { ...c, llego_at } : c)),
    }));

    const { error } = await supabase
      .from("carreras")
      .update({ llego_at })
      .eq("id", id)
      .eq("estado", "aceptada");

    if (error && anterior) {
      setState((s) => ({
        ...s,
        carreras: s.carreras.map((c) => (c.id === id ? anterior : c)),
        error: error.message,
      }));
    }

    return !error;
  }, []);

  const quoteCarrera = useCallback(async (id: string, precio: number) => {
    if (!Number.isFinite(precio) || precio <= 0) return false;
    const anterior = carrerasRef.current.find((c) => c.id === id);

    setState((s) => ({
      ...s,
      carreras: s.carreras.map((c) => (c.id === id ? { ...c, precio } : c)),
    }));

    const { error } = await supabase
      .from("carreras")
      .update({ precio })
      .eq("id", id);

    if (error && anterior) {
      setState((s) => ({
        ...s,
        carreras: s.carreras.map((c) => (c.id === id ? anterior : c)),
        error: error.message,
      }));
    }

    return !error;
  }, []);

  return { ...state, createCarrera, updateCarreraEstado, marcarLlegadaCarrera, quoteCarrera };
}

export function useRealtimeCarreras(conductorId: string, onCarrera: (carrera: Carrera) => void) {
  const callbackRef = useRef(onCarrera);
  callbackRef.current = onCarrera;

  useEffect(() => {
    if (!conductorId) return;

    const channel = supabase
      .channel(`carreras-${conductorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carreras", filter: `conductor_id=eq.${conductorId}` },
        (payload) => {
          callbackRef.current(payload.new as Carrera);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conductorId]);
}
