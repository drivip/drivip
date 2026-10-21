import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConversacionCliente, MensajeDirecto, MensajeEmisorRol } from "@drivip/types";
import { supabase } from "./client";
import { enviarPushCarrera } from "./notificacionesCarrera";

export function useConversacionesCliente() {
  const [conversaciones, setConversaciones] = useState<ConversacionCliente[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    const { data, error: queryError } = await supabase.rpc("listar_conversaciones_cliente");
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }
    setConversaciones((data as ConversacionCliente[] | null) ?? []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    void fetchAll();
    return () => { cancelled = true; };
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel("conversaciones-cliente-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes_directos" },
        () => {
          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = setTimeout(() => { void fetchAll(); }, 120);
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const crearConversacion = useCallback(async (tenantId: string, carreraId: string | null = null) => {
    const { data, error: rpcError } = await supabase.rpc("obtener_o_crear_conversacion", {
      p_tenant_id: tenantId,
      p_carrera_id: carreraId,
    });
    if (rpcError) {
      setError(rpcError.message);
      return null;
    }
    await fetchAll();
    return (data as string | null) ?? null;
  }, [fetchAll]);

  const marcarLeida = useCallback(async (conversacionId: string) => {
    setConversaciones((prev) =>
      prev.map((conversacion) =>
        conversacion.conversacion_id === conversacionId
          ? { ...conversacion, no_leidos: 0 }
          : conversacion
      )
    );
    await supabase.rpc("marcar_mensajes_directos_leidos", {
      p_conversacion_id: conversacionId,
    });
  }, []);

  const totalNoLeidos = useMemo(
    () => conversaciones.reduce((total, conversacion) => total + (conversacion.no_leidos ?? 0), 0),
    [conversaciones]
  );

  return {
    conversaciones,
    userId,
    loading,
    error,
    totalNoLeidos,
    crearConversacion,
    marcarLeida,
    refetch: fetchAll,
  };
}

export function useMensajesDirectos(
  conversacionId: string | null,
  rol: MensajeEmisorRol,
  pushCarreraId: string | null = null
) {
  const [mensajes, setMensajes] = useState<MensajeDirecto[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(conversacionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!conversacionId) {
      setMensajes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setMensajes([]);
    setLoading(true);
    setError(null);

    supabase
      .from("mensajes_directos")
      .select("*")
      .eq("conversacion_id", conversacionId)
      .order("created_at", { ascending: true })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) {
          setError(queryError.message);
          setMensajes([]);
        } else {
          setMensajes((data as MensajeDirecto[]) ?? []);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`mensajes-directos-${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensajes_directos",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as MensajeDirecto;
            setMensajes((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
            return;
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as MensajeDirecto;
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
  }, [conversacionId]);

  const enviar = useCallback(async (contenido: string) => {
    const texto = contenido.trim().slice(0, 1000);
    if (!conversacionId || !texto) return false;

    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const emisorId = authData.user?.id;
    if (!emisorId) {
      setError("Inicia sesion para enviar mensajes");
      return false;
    }

    const { data, error: insertError } = await supabase
      .from("mensajes_directos")
      .insert({
        conversacion_id: conversacionId,
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

    const row = data as MensajeDirecto;
    setMensajes((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));

    if (pushCarreraId) {
      void enviarPushCarrera({
        carrera_id: pushCarreraId,
        title: rol === "conductor" ? "Mensaje de tu conductor" : "Mensaje de tu cliente",
        body: texto.length > 140 ? `${texto.slice(0, 137)}...` : texto,
        tag: `chat-${conversacionId}`,
        data: { conversacion_id: conversacionId, carrera_id: pushCarreraId },
      });
    }

    return true;
  }, [conversacionId, pushCarreraId, rol]);

  const marcarLeidos = useCallback(async () => {
    if (!conversacionId || !userId) return;
    const receptor = userId;

    setMensajes((prev) =>
      prev.map((m) => (m.emisor_id !== receptor && !m.leido ? { ...m, leido: true } : m))
    );

    await supabase.rpc("marcar_mensajes_directos_leidos", {
      p_conversacion_id: conversacionId,
    });
  }, [conversacionId, userId]);

  const noLeidos = useMemo(
    () => mensajes.filter((m) => m.emisor_id !== userId && !m.leido).length,
    [mensajes, userId]
  );

  return { mensajes, userId, loading, error, noLeidos, enviar, marcarLeidos };
}
