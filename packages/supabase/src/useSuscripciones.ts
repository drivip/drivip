import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Suscripcion } from "@drivip/types";

interface SuscripcionesState {
  pendientes: Suscripcion[];
  todas: Suscripcion[];
  loading: boolean;
  error: string | null;
}

export const PRECIO_SUSCRIPCION_USD = 25;

export interface DatosPagoSuscripcionInput {
  tenantId: string;
  banco: string;
  referencia: string;
  monto: number;
}

export async function crearSuscripcionPendiente(tenantId: string) {
  const { data, error } = await supabase
    .from("suscripciones")
    .insert({
      tenant_id: tenantId,
      monto: PRECIO_SUSCRIPCION_USD,
      moneda: "USD",
      metodo_pago: "pago_movil",
      estado: "pendiente",
    })
    .select("id")
    .maybeSingle();

  return { id: (data?.id as string | undefined) ?? null, error: error?.message ?? null };
}

export async function enviarDatosPagoSuscripcion(input: DatosPagoSuscripcionInput) {
  const { data: existente, error: findError } = await supabase
    .from("suscripciones")
    .select("id, estado")
    .eq("tenant_id", input.tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) return { error: findError.message };

  const payload = {
    banco_origen: input.banco.trim(),
    referencia: input.referencia.trim(),
    monto: input.monto,
    moneda: "USD",
    metodo_pago: "pago_movil" as const,
  };

  if (existente?.id && existente.estado === "pendiente") {
    const { error } = await supabase
      .from("suscripciones")
      .update(payload)
      .eq("id", existente.id as string);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("suscripciones").insert({
    tenant_id: input.tenantId,
    estado: "pendiente",
    ...payload,
  });

  return { error: error?.message ?? null };
}

export function useMiSuscripcion(tenantId: string | null | undefined) {
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setSuscripcion(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("suscripciones")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setSuscripcion(null);
    } else {
      setError(null);
      setSuscripcion((data as Suscripcion | null) ?? null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { suscripcion, loading, error, refetch };
}

export function useSuscripciones() {
  const [state, setState] = useState<SuscripcionesState>({
    pendientes: [],
    todas: [],
    loading: true,
    error: null,
  });

  const fetchSuscripciones = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const [pendientesRes, todasRes] = await Promise.all([
      supabase
        .from("suscripciones")
        .select("*")
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("suscripciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const error = pendientesRes.error ?? todasRes.error;
    if (error) {
      setState({ pendientes: [], todas: [], loading: false, error: error.message });
    } else {
      setState({
        pendientes: (pendientesRes.data as Suscripcion[]) ?? [],
        todas: (todasRes.data as Suscripcion[]) ?? [],
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    void fetchSuscripciones();
  }, [fetchSuscripciones]);

  useEffect(() => {
    const channel = supabase
      .channel("suscripciones-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "suscripciones" },
        () => {
          void fetchSuscripciones();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchSuscripciones]);

  const verificarSuscripcion = useCallback(
    async (id: string, aprobado: boolean, verificadoPor: string) => {
      const { data: tenantId, error } = await supabase.rpc("verificar_suscripcion", {
        p_id: id,
        p_aprobado: aprobado,
        p_verificado_por: verificadoPor,
      });

      if (error || !tenantId) return false;

      await fetchSuscripciones();

      void supabase.functions
        .invoke("send-push", {
          body: {
            tenant_id: tenantId,
            title: aprobado ? "Suscripcion aprobada" : "Suscripcion rechazada",
            body: aprobado
              ? "Tu cuenta ya esta activa. Ya puedes recibir solicitudes."
              : "No pudimos verificar tu pago. Revisa el comprobante.",
            url: "/",
          },
        })
        .catch(() => undefined);

      return true;
    },
    [fetchSuscripciones]
  );

  return { ...state, verificarSuscripcion, refetch: fetchSuscripciones };
}
