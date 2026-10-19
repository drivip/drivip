import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { PedidoB2B, PedidoB2BEstado } from "@drivip/types";

export function usePedidosB2B() {
  const [pedidos, setPedidos] = useState<PedidoB2B[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("pedidos_b2b")
      .select("*")
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setPedidos([]);
    } else {
      setPedidos((data as PedidoB2B[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const crearPedido = useCallback(async (input: { empresa: string; destino: string; monto?: number }) => {
    const { data, error: insertError } = await supabase
      .from("pedidos_b2b")
      .insert({
        empresa: input.empresa.trim(),
        destino: input.destino.trim(),
        monto: input.monto ?? null,
      })
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    setPedidos((prev) => [data as PedidoB2B, ...prev]);
    return { error: null };
  }, []);

  const actualizarPedido = useCallback(async (id: string, updates: { estado?: PedidoB2BEstado; conductor?: string | null }) => {
    const { data, error: updateError } = await supabase
      .from("pedidos_b2b")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (updateError) return { error: updateError.message };
    setPedidos((prev) => prev.map((p) => (p.id === id ? (data as PedidoB2B) : p)));
    return { error: null };
  }, []);

  return { pedidos, loading, error, refetch, crearPedido, actualizarPedido };
}
