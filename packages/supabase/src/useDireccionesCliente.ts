import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { DireccionCliente } from "@drivip/types";

export interface NuevaDireccion {
  alias: string;
  direccion: string;
  referencia?: string;
  lat?: number | null;
  lng?: number | null;
  icono?: string;
  predeterminada?: boolean;
}

export function useDireccionesCliente(userId: string | null | undefined) {
  const [direcciones, setDirecciones] = useState<DireccionCliente[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setDirecciones([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("direcciones_cliente")
      .select("*")
      .eq("cliente_id", userId)
      .order("predeterminada", { ascending: false })
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setDirecciones([]);
    } else {
      setDirecciones((data as DireccionCliente[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const crearDireccion = useCallback(
    async (input: NuevaDireccion): Promise<{ error: string | null }> => {
      if (!userId) return { error: "Usuario no disponible" };
      if (input.predeterminada) {
        await supabase
          .from("direcciones_cliente")
          .update({ predeterminada: false })
          .eq("cliente_id", userId);
      }
      const { data, error: insertError } = await supabase
        .from("direcciones_cliente")
        .insert({
          cliente_id: userId,
          alias: input.alias.trim(),
          direccion: input.direccion.trim(),
          referencia: input.referencia?.trim() || null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          icono: input.icono ?? "home",
          predeterminada: input.predeterminada ?? false,
        })
        .select()
        .single();
      if (insertError) return { error: insertError.message };
      setDirecciones((prev) => [data as DireccionCliente, ...(input.predeterminada ? prev.map((d) => ({ ...d, predeterminada: false })) : prev)]);
      return { error: null };
    },
    [userId]
  );

  const eliminarDireccion = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error: deleteError } = await supabase.from("direcciones_cliente").delete().eq("id", id);
    if (deleteError) return { error: deleteError.message };
    setDirecciones((prev) => prev.filter((d) => d.id !== id));
    return { error: null };
  }, []);

  const marcarPredeterminada = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!userId) return { error: "Usuario no disponible" };
    const { error: clearError } = await supabase
      .from("direcciones_cliente")
      .update({ predeterminada: false })
      .eq("cliente_id", userId);
    if (clearError) return { error: clearError.message };
    const { error: setError } = await supabase
      .from("direcciones_cliente")
      .update({ predeterminada: true })
      .eq("id", id);
    if (setError) return { error: setError.message };
    setDirecciones((prev) => prev.map((d) => ({ ...d, predeterminada: d.id === id })));
    return { error: null };
  }, [userId]);

  return { direcciones, loading, error, refetch, crearDireccion, eliminarDireccion, marcarPredeterminada };
}
