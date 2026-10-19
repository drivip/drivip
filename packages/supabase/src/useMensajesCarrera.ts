import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./client";
import { enviarPushCarrera } from "./notificacionesCarrera";
import type { MensajeCarrera, MensajeEmisorRol } from "@drivip/types";

export function useMensajesCarrera(carreraId: string | null, rol: MensajeEmisorRol) {
  const [mensajes, setMensajes] = useState<MensajeCarrera[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(carreraId));
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  userIdRef.current = userId;

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!carreraId) {
      setMensajes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setMensajes([]);
    setError(null);
    setLoading(true);

    supabase
      .from("mensajes_carrera")
      .select("*")
      .eq("carrera_id", carreraId)
      .order("created_at", { ascending: true })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) {
          setError(queryError.message);
          setMensajes([]);
        } else {
          setMensajes((data as MensajeCarrera[]) ?? []);
          setError(null);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`mensajes-carrera-${carreraId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensajes_carrera",
          filter: `carrera_id=eq.${carreraId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as MensajeCarrera;
            setMensajes((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
            return;
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as MensajeCarrera;
            setMensajes((prev) => prev.map((m) => (m.id === row.id ? row : m)));
            return;
          }
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            setMensajes((prev) => prev.filter((m) => m.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [carreraId]);

  const enviar = useCallback(async (contenido: string) => {
    const texto = contenido.trim().slice(0, 1000);
    if (!carreraId || !texto) return false;

    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const emisorId = authData.user?.id;
    if (!emisorId) {
      setError("Inicia sesion para enviar mensajes");
      return false;
    }

    const { data, error: insertError } = await supabase
      .from("mensajes_carrera")
      .insert({
        carrera_id: carreraId,
        emisor_id: emisorId,
        emisor_rol: rol,
        contenido: texto,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return false;
    }

    const row = data as MensajeCarrera;
    setMensajes((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));

    void enviarPushCarrera({
      carrera_id: carreraId,
      title: rol === "conductor" ? "Mensaje de tu conductor" : "Mensaje de tu cliente",
      body: texto.length > 140 ? `${texto.slice(0, 137)}...` : texto,
      tag: `chat-${carreraId}`,
      data: { carrera_id: carreraId },
    });

    return true;
  }, [carreraId, rol]);

  const marcarLeidos = useCallback(async () => {
    if (!carreraId || !userIdRef.current) return;
    const receptor = userIdRef.current;

    setMensajes((prev) =>
      prev.map((m) => (m.emisor_id !== receptor && !m.leido ? { ...m, leido: true } : m))
    );

    await supabase.rpc("marcar_mensajes_leidos", { p_carrera_id: carreraId });
  }, [carreraId]);

  const noLeidos = useMemo(
    () => mensajes.filter((m) => m.emisor_id !== userId && !m.leido).length,
    [mensajes, userId]
  );

  return { mensajes, userId, loading, error, noLeidos, enviar, marcarLeidos };
}
