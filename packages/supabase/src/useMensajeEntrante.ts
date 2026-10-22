import { useCallback, useEffect, useRef, useState } from "react";

export interface ConversacionNotificable {
  conversacion_id: string;
  ultimo_emisor_id: string | null;
  ultimo_mensaje: string | null;
  ultimo_mensaje_at: string | null;
  no_leidos: number;
}

export interface MensajeEntrante<T extends ConversacionNotificable> {
  conversacion: T;
  count: number;
}

/**
 * Detecta mensajes entrantes a partir de la lista de conversaciones que ya
 * mantienen los hooks de mensajes. Ignora el historial inicial y los mensajes
 * enviados por el propio usuario.
 */
export function useMensajeEntrante<T extends ConversacionNotificable>(
  conversaciones: T[],
  userId: string | null,
  loading = false
): { mensaje: MensajeEntrante<T> | null; ocultar: () => void } {
  const [mensaje, setMensaje] = useState<MensajeEntrante<T> | null>(null);
  const lastSeenRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    if (loading || !userId) return;

    let maxTime = 0;
    for (const conversacion of conversaciones) {
      if (!conversacion.ultimo_mensaje_at) continue;
      const time = new Date(conversacion.ultimo_mensaje_at).getTime();
      if (Number.isFinite(time) && time > maxTime) maxTime = time;
    }

    if (!readyRef.current) {
      readyRef.current = true;
      lastSeenRef.current = maxTime;
      return;
    }

    const base = lastSeenRef.current;
    const entrantes = conversaciones
      .filter((conversacion) => {
        if (!conversacion.ultimo_mensaje || !conversacion.ultimo_mensaje_at) return false;
        if (!conversacion.ultimo_emisor_id || conversacion.ultimo_emisor_id === userId) {
          return false;
        }
        const time = new Date(conversacion.ultimo_mensaje_at).getTime();
        return Number.isFinite(time) && time > base;
      })
      .sort(
        (a, b) =>
          new Date(a.ultimo_mensaje_at ?? 0).getTime() -
          new Date(b.ultimo_mensaje_at ?? 0).getTime()
      );

    if (entrantes.length === 0) return;

    const ultima = entrantes[entrantes.length - 1];
    const ultimaTime = new Date(ultima.ultimo_mensaje_at ?? 0).getTime();
    lastSeenRef.current = Math.max(base, Number.isFinite(ultimaTime) ? ultimaTime : base);
    setMensaje({ conversacion: ultima, count: entrantes.length });
  }, [conversaciones, loading, userId]);

  const ocultar = useCallback(() => setMensaje(null), []);

  return { mensaje, ocultar };
}
