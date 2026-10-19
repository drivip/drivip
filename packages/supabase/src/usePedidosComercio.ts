import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { PedidoComercio, PedidoComercioEstado, PedidoComercioItem } from "@drivip/types";

export interface NuevoPedidoComercio {
  cliente_nombre: string;
  telefono?: string;
  direccion_entrega?: string;
  items: PedidoComercioItem[];
  total: number;
}

export function usePedidosComercio(tenantId: string | null | undefined) {
  const [pedidos, setPedidos] = useState<PedidoComercio[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setPedidos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("pedidos_comercio")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setPedidos([]);
    } else {
      setPedidos((data as PedidoComercio[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const crearPedido = useCallback(async (input: NuevoPedidoComercio) => {
    if (!tenantId) return { error: "Tenant no disponible" };
    const { data, error: insertError } = await supabase
      .from("pedidos_comercio")
      .insert({
        tenant_id: tenantId,
        cliente_nombre: input.cliente_nombre.trim(),
        telefono: input.telefono?.trim() || null,
        direccion_entrega: input.direccion_entrega?.trim() || null,
        items: input.items,
        total: input.total,
      })
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    setPedidos((prev) => [data as PedidoComercio, ...prev]);
    return { error: null };
  }, [tenantId]);

  const actualizarEstado = useCallback(async (id: string, estado: PedidoComercioEstado) => {
    const { data, error: updateError } = await supabase
      .from("pedidos_comercio")
      .update({ estado })
      .eq("id", id)
      .select()
      .single();
    if (updateError) return { error: updateError.message };
    setPedidos((prev) => prev.map((p) => (p.id === id ? (data as PedidoComercio) : p)));
    return { error: null };
  }, []);

  return { pedidos, loading, error, refetch, crearPedido, actualizarEstado };
}
