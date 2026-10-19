import { supabase } from "./client";
import type { PublicTenant } from "@drivip/types";

export interface AgregarConductorResult {
  ok: boolean;
  red_id: string;
  tenant_id: string;
  slug: string;
  nombre: string;
  pausado: boolean;
  suscripcion_activa: boolean;
}

/** Busca conductores por nombre o slug (RPC publica, sin exponer datos privados). */
export async function buscarConductores(query: string): Promise<PublicTenant[]> {
  const { data, error } = await supabase.rpc("buscar_conductores", {
    p_query: query.trim(),
  });
  if (error) throw new Error(error.message);
  return (data as PublicTenant[]) ?? [];
}

/** Agrega un conductor a la red del cliente autenticado y registra el cliente en su tenant. */
export async function agregarConductorRed(
  slug: string,
  apodo?: string | null
): Promise<AgregarConductorResult> {
  const { data, error } = await supabase.rpc("agregar_conductor_red", {
    p_slug: slug.trim(),
    p_apodo: apodo?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return data as AgregarConductorResult;
}
