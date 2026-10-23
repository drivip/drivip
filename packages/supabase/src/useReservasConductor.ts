import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import { enviarPushReserva } from "./notificacionesCarrera";
import type { ReservaCliente, ReservaEstado } from "@drivip/types";

export function useReservasConductor(tenantId: string | null | undefined) {
  const [reservas, setReservas] = useState<ReservaCliente[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setReservas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("reservas")
      .select("*")
      .eq("conductor_tenant_id", tenantId)
      .order("fecha_hora", { ascending: true })
      .limit(100);
    if (queryError) {
      setError(queryError.message);
      setReservas([]);
    } else {
      setReservas((data as ReservaCliente[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`reservas-conductor-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservas",
          filter: `conductor_tenant_id=eq.${tenantId}`,
        },
        () => {
          void refetch();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, refetch]);

  const actualizarEstadoReserva = useCallback(
    async (id: string, estado: ReservaEstado): Promise<boolean> => {
      const { data, error: updateError } = await supabase
        .from("reservas")
        .update({ estado })
        .eq("id", id)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
        return false;
      }
      setError(null);
      const reserva = data as ReservaCliente;
      setReservas((prev) =>
        prev.map((item) => (item.id === id ? reserva : item))
      );
      if (estado === "confirmada" || estado === "cancelada" || estado === "completada") {
        const title =
          estado === "confirmada"
            ? "Reserva confirmada"
            : estado === "cancelada"
              ? "Reserva cancelada"
              : "Reserva completada";
        void enviarPushReserva({
          reserva_id: id,
          title,
          body: `${reserva.origen} hacia ${reserva.destino}`,
          tag: `reserva-${id}`,
          data: { reserva_id: id },
        });
      }
      return true;
    },
    []
  );

  return { reservas, loading, error, refetch, actualizarEstadoReserva };
}
