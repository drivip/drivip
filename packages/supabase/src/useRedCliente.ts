import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { RedCliente } from "@drivip/types";

export function useRedCliente(clienteId: string) {
  const [contactos, setContactos] = useState<RedCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("red_cliente")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("agregado_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setContactos((data as RedCliente[]) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [clienteId]);

  const agregarContacto = useCallback(async (contacto: Omit<RedCliente, "id" | "agregado_at">) => {
    const { data, error } = await supabase
      .from("red_cliente")
      .insert(contacto)
      .select()
      .single();

    if (error) return null;
    setContactos((prev) => [data as RedCliente, ...prev]);
    return data as RedCliente;
  }, []);

  const eliminarContacto = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("red_cliente")
      .delete()
      .eq("id", id);

    if (!error) {
      setContactos((prev) => prev.filter((c) => c.id !== id));
    }
    return !error;
  }, []);

  return { contactos, loading, agregarContacto, eliminarContacto };
}
