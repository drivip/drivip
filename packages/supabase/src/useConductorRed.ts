import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Carrera, ConductorRed, MetodoPago } from "@drivip/types";

/** Conductores que el cliente agrego a su red (info publica + telefono). */
export function useConductoresRed() {
  const [conductores, setConductores] = useState<ConductorRed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_conductores_red");
    if (rpcError) {
      setError(rpcError.message);
      setConductores([]);
    } else {
      setConductores(((data as ConductorRed[]) ?? []).map((c) => ({
        ...c,
        calificacion: c.calificacion === null ? null : Number(c.calificacion),
      })));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  return { conductores, loading, error, refetch: fetchAll };
}

export interface CrearCarreraClienteInput {
  conductor_tenant_id: string;
  origen_lat: number;
  origen_lng: number;
  origen_direccion: string;
  destino_lat: number;
  destino_lng: number;
  destino_direccion: string;
  distancia_km: number;
  duracion_min: number;
  precio: number;
  metodo_pago: MetodoPago;
}

/** Crea una carrera real validando que el conductor este en la red. */
export async function crearCarreraCliente(input: CrearCarreraClienteInput): Promise<Carrera | null> {
  const { data, error } = await supabase.rpc("crear_carrera_cliente", {
    p_conductor_tenant_id: input.conductor_tenant_id,
    p_origen_lat: input.origen_lat,
    p_origen_lng: input.origen_lng,
    p_origen_direccion: input.origen_direccion,
    p_destino_lat: input.destino_lat,
    p_destino_lng: input.destino_lng,
    p_destino_direccion: input.destino_direccion,
    p_distancia_km: input.distancia_km,
    p_duracion_min: input.duracion_min,
    p_precio: input.precio,
    p_metodo_pago: input.metodo_pago,
  });
  if (error || !data) return null;
  return data as Carrera;
}

/** Carreras del cliente autenticado (historial). */
export function useMisCarreras(clienteId: string | null | undefined) {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(Boolean(clienteId));
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!clienteId) {
      setCarreras([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("carreras")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setCarreras([]);
    } else {
      setCarreras((data as Carrera[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  return { carreras, loading, error, refetch: fetchAll };
}

/** El cliente califica un viaje y se recalcula el promedio del conductor. */
export async function calificarCarrera(carreraId: string, calificacion: number, comentario?: string) {
  const { error } = await supabase.rpc("calificar_carrera", {
    p_carrera_id: carreraId,
    p_calificacion: calificacion,
    p_comentario: comentario ?? null,
  });
  return !error;
}

/** El cliente cancela su carrera. */
export async function cancelarCarrera(carreraId: string) {
  const { error } = await supabase.rpc("cancelar_carrera", { p_carrera_id: carreraId });
  return !error;
}
