import { useCallback, useEffect, useState } from "react";
import type { DisponibilidadConductor } from "@drivip/types";
import { supabase } from "./client";

export interface ResultadoDisponibilidad {
  ok: boolean;
  error?: string;
  /** true cuando el estado se guard� localmente pero no en Supabase. */
  local?: boolean;
}

export interface DisponibilidadLocal {
  estado: DisponibilidadConductor;
  nota: string | null;
  hasta: string | null;
  at: number;
}

const LOCAL_PREFIX = "drivip:disponibilidad:";

function localKey(tenantId: string): string {
  return `${LOCAL_PREFIX}${tenantId}`;
}

export function leerDisponibilidadLocal(
  tenantId?: string | null
): DisponibilidadLocal | null {
  if (!tenantId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localKey(tenantId));
    if (!raw) return null;
    const value = JSON.parse(raw) as DisponibilidadLocal;
    if (!value?.estado) return null;
    return value;
  } catch {
    return null;
  }
}

function guardarDisponibilidadLocal(
  tenantId: string | null | undefined,
  estado: DisponibilidadConductor,
  nota: string | null,
  hasta: string | null
) {
  if (!tenantId || typeof window === "undefined") return;
  try {
    const value: DisponibilidadLocal = { estado, nota, hasta, at: Date.now() };
    window.localStorage.setItem(localKey(tenantId), JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible: el estado sigue en memoria.
  }
}

export function limpiarDisponibilidadLocal(tenantId?: string | null) {
  if (!tenantId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(localKey(tenantId));
  } catch {
    // nada que limpiar
  }
}

function calcularHasta(estado: DisponibilidadConductor): string | null {
  return estado === "pausa_30"
    ? new Date(Date.now() + 30 * 60000).toISOString()
    : null;
}

function notaParaEstado(estado: DisponibilidadConductor, nota?: string | null): string | null {
  const limpia = nota?.trim() || null;
  if (estado === "personalizado") return limpia || "No disponible";
  if (estado === "pausa_30") return limpia || "Se desocupa en 30 min";
  return null;
}

/**
 * Guarda la disponibilidad del conductor.
 *
 * Primero usa la RPC segura. Si la migración todavía no está aplicada en el
 * proyecto remoto, intenta un UPDATE directo sobre su propio tenant para que
 * el cambio no se pierda mientras se despliega el SQL.
 */
export async function actualizarDisponibilidadConductor(
  estado: DisponibilidadConductor,
  nota?: string | null,
  tenantId?: string | null
): Promise<ResultadoDisponibilidad> {
  const notaFinal = notaParaEstado(estado, nota);
  const hasta = calcularHasta(estado);

  const { error } = await supabase.rpc("actualizar_disponibilidad_conductor", {
    p_estado: estado,
    p_nota: notaFinal,
  });

  if (!error) {
    limpiarDisponibilidadLocal(tenantId);
    return { ok: true };
  }

  if (tenantId) {
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        disponibilidad: estado,
        disponibilidad_nota: notaFinal,
        disponibilidad_hasta: hasta,
      })
      .eq("id", tenantId);

    if (!updateError) {
      limpiarDisponibilidadLocal(tenantId);
      return { ok: true };
    }
  }

  // La migraci�n a�n no est� aplicada (o RLS lo impide): guardamos en el
  // dispositivo para que el estado sobreviva a una recarga.
  guardarDisponibilidadLocal(tenantId, estado, notaFinal, hasta);
  return { ok: false, error: error.message, local: true };
}

export function useDisponibilidadConductor(
  inicial: DisponibilidadConductor = "disponible",
  notaInicial: string | null = null
) {
  const [estado, setEstado] = useState<DisponibilidadConductor>(inicial);
  const [nota, setNota] = useState<string | null>(notaInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEstado(inicial);
    setNota(notaInicial);
  }, [inicial, notaInicial]);

  const guardar = useCallback(
    async (nuevoEstado: DisponibilidadConductor, nuevaNota?: string | null) => {
      const anteriorEstado = estado;
      const anteriorNota = nota;
      setEstado(nuevoEstado);
      setNota(nuevaNota?.trim() || null);
      setGuardando(true);
      setError(null);

      const resultado = await actualizarDisponibilidadConductor(
        nuevoEstado,
        nuevaNota
      );

      setGuardando(false);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar la disponibilidad");
        setEstado(anteriorEstado);
        setNota(anteriorNota);
        return false;
      }
      return true;
    },
    [estado, nota]
  );

  return { estado, nota, guardando, error, guardar };
}
