import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import { enviarPushReserva } from "./notificacionesCarrera";
import type { ReservaCliente } from "@drivip/types";

export interface NuevaReserva {
  origen: string;
  destino: string;
  fecha_hora: string;
  notas?: string;
  precio_usd?: number | null;
  conductor_tenant_id?: string | null;
  origen_lat?: number | null;
  origen_lng?: number | null;
  destino_lat?: number | null;
  destino_lng?: number | null;
}

export function useReservasCliente(userId: string | null | undefined) {
  const [reservas, setReservas] = useState<ReservaCliente[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setReservas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("reservas")
      .select("*")
      .eq("cliente_id", userId)
      .order("fecha_hora", { ascending: true });
    if (queryError) {
      setError(queryError.message);
      setReservas([]);
    } else {
      setReservas((data as ReservaCliente[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const crearReserva = useCallback(
    async (input: NuevaReserva): Promise<{ error: string | null }> => {
      if (!userId) return { error: "Usuario no disponible" };
      const { data, error: insertError } = await supabase
        .from("reservas")
        .insert({
          cliente_id: userId,
          conductor_tenant_id: input.conductor_tenant_id ?? null,
          origen: input.origen.trim(),
          destino: input.destino.trim(),
          fecha_hora: input.fecha_hora,
          notas: input.notas?.trim() || null,
          precio_usd: input.precio_usd ?? null,
          origen_lat: input.origen_lat ?? null,
          origen_lng: input.origen_lng ?? null,
          destino_lat: input.destino_lat ?? null,
          destino_lng: input.destino_lng ?? null,
        })
        .select()
        .single();
      if (insertError) return { error: insertError.message };
      const reserva = data as ReservaCliente;
      setReservas((prev) => [...prev, reserva].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora)));
      if (reserva.conductor_tenant_id) {
        void enviarPushReserva({
          reserva_id: reserva.id,
          title: "Nueva reserva",
          body: `${reserva.origen} hacia ${reserva.destino}`,
          tag: `reserva-${reserva.id}`,
          data: { reserva_id: reserva.id },
        });
      }
      return { error: null };
    },
    [userId]
  );

  const cancelarReserva = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const reserva = reservas.find((r) => r.id === id);
    const { error: updateError } = await supabase
      .from("reservas")
      .update({ estado: "cancelada" })
      .eq("id", id);
    if (updateError) return { error: updateError.message };
    setReservas((prev) => prev.map((r) => (r.id === id ? { ...r, estado: "cancelada" } : r)));
    if (reserva?.conductor_tenant_id) {
      void enviarPushReserva({
        reserva_id: id,
        title: "Reserva cancelada",
        body: `${reserva.origen} hacia ${reserva.destino}`,
        tag: `reserva-${id}`,
        data: { reserva_id: id },
      });
    }
    return { error: null };
  }, [reservas]);

  return { reservas, loading, error, refetch, crearReserva, cancelarReserva };
}
