import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Producto } from "@drivip/types";

export interface NuevoProducto {
  nombre: string;
  precio: number;
  stock: number;
}

export function useProductos(tenantId: string | null | undefined) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setProductos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("productos")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setProductos([]);
    } else {
      setProductos((data as Producto[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const crearProducto = useCallback(async (input: NuevoProducto) => {
    if (!tenantId) return { error: "Tenant no disponible" };
    const { data, error: insertError } = await supabase
      .from("productos")
      .insert({
        tenant_id: tenantId,
        nombre: input.nombre.trim(),
        precio: input.precio,
        stock: input.stock,
      })
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    setProductos((prev) => [data as Producto, ...prev]);
    return { error: null };
  }, [tenantId]);

  const actualizarProducto = useCallback(async (id: string, updates: Partial<Pick<Producto, "nombre" | "precio" | "stock" | "activo">>) => {
    const { data, error: updateError } = await supabase
      .from("productos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (updateError) return { error: updateError.message };
    setProductos((prev) => prev.map((p) => (p.id === id ? (data as Producto) : p)));
    return { error: null };
  }, []);

  const eliminarProducto = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from("productos").delete().eq("id", id);
    if (deleteError) return { error: deleteError.message };
    setProductos((prev) => prev.filter((p) => p.id !== id));
    return { error: null };
  }, []);

  return { productos, loading, error, refetch, crearProducto, actualizarProducto, eliminarProducto };
}
