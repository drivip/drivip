import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminConversacion, AdminMensaje } from "@drivip/types";
import { supabase } from "./client";

interface RpcErrorLike {
  code?: string;
  message?: string;
}

function esFuncionNoDisponible(error: RpcErrorLike | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST202" ||
    /could not find the function|schema cache|does not exist/i.test(error.message ?? "")
  );
}

interface UseAdminMensajesOptions {
  generarAvisos?: boolean;
  notificarPush?: boolean;
}

export function useAdminMensajes(
  tenantId: string | null,
  options: UseAdminMensajesOptions = {}
) {
  const { generarAvisos = true, notificarPush = false } = options;
  const [mensajes, setMensajes] = useState<AdminMensaje[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [mensajeEntrante, setMensajeEntrante] = useState<AdminMensaje | null>(null);

  const userIdRef = useRef<string | null>(null);
  const lastSeenAtRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const id = data.user?.id ?? null;
      userIdRef.current = id;
      setUserId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    readyRef.current = false;
    lastSeenAtRef.current = 0;
    setMensajeEntrante(null);
  }, [tenantId]);

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setMensajes([]);
      setLoading(false);
      setError(null);
      setAvailable(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (generarAvisos) {
      const { error: avisoError } = await supabase.rpc("generar_avisos_suscripcion");
      if (avisoError && esFuncionNoDisponible(avisoError)) {
        setAvailable(false);
      }
    }

    const { data, error: queryError } = await supabase.rpc("listar_mensajes_admin", {
      p_tenant_id: tenantId,
      p_limit: 100,
    });

    if (queryError) {
      if (esFuncionNoDisponible(queryError)) {
        setAvailable(false);
        setMensajes([]);
        setError(null);
      } else {
        setError(queryError.message);
        setMensajes([]);
      }
      setLoading(false);
      return;
    }

    const rows = (data as AdminMensaje[] | null) ?? [];
    setAvailable(true);
    setMensajes(rows);
    const maxTime = rows.reduce((max, item) => {
      const time = new Date(item.created_at).getTime();
      return Number.isFinite(time) ? Math.max(max, time) : max;
    }, 0);
    lastSeenAtRef.current = maxTime;
    readyRef.current = true;
    setLoading(false);
  }, [generarAvisos, tenantId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`admin-mensajes-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_mensajes",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as AdminMensaje;
            setMensajes((prev) => (prev.some((item) => item.id === row.id) ? prev : [...prev, row]));

            const time = new Date(row.created_at).getTime();
            const esEntrante =
              row.emisor_rol !== "conductor" && row.emisor_id !== userIdRef.current;
            if (readyRef.current && esEntrante && Number.isFinite(time) && time > lastSeenAtRef.current) {
              lastSeenAtRef.current = time;
              setMensajeEntrante(row);
            }
            return;
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as AdminMensaje;
            setMensajes((prev) => prev.map((item) => (item.id === row.id ? row : item)));
            return;
          }

          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            setMensajes((prev) => prev.filter((item) => item.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const enviar = useCallback(
    async (contenido: string, titulo: string | null = null) => {
      const texto = contenido.trim().slice(0, 2000);
      if (!tenantId || !texto) return false;

      setError(null);
      const { error: sendError } = await supabase.rpc("enviar_mensaje_admin", {
        p_tenant_id: tenantId,
        p_titulo: titulo,
        p_contenido: texto,
      });

      if (sendError) {
        setError(sendError.message);
        return false;
      }

      if (notificarPush) {
        void supabase.functions
          .invoke("send-push", {
            body: {
              tenant_id: tenantId,
              title: "Drivip Soporte",
              body: texto.length > 140 ? `${texto.slice(0, 137)}...` : texto,
              url: "/",
            },
          })
          .catch(() => undefined);
      }

      await fetchAll();
      return true;
    },
    [fetchAll, notificarPush, tenantId]
  );

  const marcarLeidos = useCallback(async () => {
    if (!tenantId) return;

    setMensajes((prev) =>
      prev.map((item) =>
        item.emisor_id !== userId ? { ...item, leido: true } : item
      )
    );

    await supabase.rpc("marcar_mensajes_admin_leidos", { p_tenant_id: tenantId });
  }, [tenantId, userId]);

  const unread = useMemo(
    () => mensajes.filter((item) => item.emisor_id !== userId && !item.leido).length,
    [mensajes, userId]
  );

  const ocultarMensajeEntrante = useCallback(() => setMensajeEntrante(null), []);

  return {
    mensajes,
    userId,
    loading,
    error,
    available,
    unread,
    mensajeEntrante,
    ocultarMensajeEntrante,
    enviar,
    marcarLeidos,
    refetch: fetchAll,
  };
}

export interface MensajeSoporteEntrante {
  tenant_id: string;
  tenant_nombre: string;
  contenido: string;
  created_at: string;
}

export function useAdminConversaciones() {
  const [conversaciones, setConversaciones] = useState<AdminConversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [mensajeEntrante, setMensajeEntrante] = useState<MensajeSoporteEntrante | null>(null);

  const conversacionesRef = useRef<AdminConversacion[]>([]);
  const readyRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    conversacionesRef.current = conversaciones;
  }, [conversaciones]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { error: avisoError } = await supabase.rpc("generar_avisos_suscripcion");
    if (avisoError && esFuncionNoDisponible(avisoError)) {
      setAvailable(false);
    }

    const { data, error: queryError } = await supabase.rpc("listar_conversaciones_admin");

    if (queryError) {
      if (esFuncionNoDisponible(queryError)) {
        setAvailable(false);
        setConversaciones([]);
        setError(null);
      } else {
        setError(queryError.message);
        setConversaciones([]);
      }
      setLoading(false);
      return;
    }

    setAvailable(true);
    setConversaciones((data as AdminConversacion[] | null) ?? []);
    readyRef.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-conversaciones-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_mensajes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as AdminMensaje;
            if (readyRef.current && row.emisor_rol === "conductor") {
              const conversacion = conversacionesRef.current.find(
                (item) => item.tenant_id === row.tenant_id
              );
              setMensajeEntrante({
                tenant_id: row.tenant_id,
                tenant_nombre: conversacion?.tenant_nombre ?? "Conductor",
                contenido: row.contenido,
                created_at: row.created_at,
              });
            }
          }

          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = setTimeout(() => {
            void fetchAll();
          }, 400);
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const totalNoLeidos = useMemo(
    () => conversaciones.reduce((total, item) => total + (item.no_leidos ?? 0), 0),
    [conversaciones]
  );

  const ocultarMensajeEntrante = useCallback(() => setMensajeEntrante(null), []);

  return {
    conversaciones,
    loading,
    error,
    available,
    totalNoLeidos,
    mensajeEntrante,
    ocultarMensajeEntrante,
    refetch: fetchAll,
  };
}
