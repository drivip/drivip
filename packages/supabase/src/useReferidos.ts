import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type {
  AdminReferidoDetalle,
  AdminReferidoRow,
  ConfigReferidos,
  CuentaReferidos,
  ProgramaReferidos,
  Referido,
} from "@drivip/types";

interface RpcErrorLike {
  code?: string;
  message?: string;
}

function esFuncionNoDisponible(error: RpcErrorLike | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST202" ||
    /could not find the function|schema cache|does not exist/i.test(error.message ?? "")
  );
}

/** Registra el codigo de referido para el conductor autenticado (post-signup). */
export async function registrarReferido(codigo: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("registrar_referido", { p_codigo: codigo });
  return { error: error?.message ?? null };
}

/** Compatibilidad con el panel anterior: lista basica de referidos. */
export function useReferidos(tenantId: string | null | undefined) {
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setReferidos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("referidos")
      .select("*")
      .eq("referidor_tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setReferidos([]);
    } else {
      setReferidos((data as Referido[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { referidos, loading, error, refetch };
}

interface ProgramaReferidosState {
  programa: ProgramaReferidos | null;
  referidos: Referido[];
  loading: boolean;
  error: string | null;
  available: boolean;
}

/**
 * Carga el programa completo del conductor: codigo, referidos, descuento,
 * comisiones, pagos y datos de socio. Si la migracion aun no esta aplicada,
 * degrada a la lista basica sin romper el panel.
 */
export function useProgramaReferidos(tenantId: string | null | undefined) {
  const [state, setState] = useState<ProgramaReferidosState>({
    programa: null,
    referidos: [],
    loading: Boolean(tenantId),
    error: null,
    available: true,
  });

  const fetchPrograma = useCallback(async () => {
    if (!tenantId) {
      setState({ programa: null, referidos: [], loading: false, error: null, available: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.rpc("obtener_mis_referidos");

    if (!error && data) {
      const programa = data as ProgramaReferidos;
      setState({
        programa,
        referidos: (programa.referidos ?? []).map((item) => ({
          id: item.id,
          referidor_tenant_id: tenantId,
          referido_tenant_id: "",
          codigo: item.codigo,
          estado: item.estado,
          plan_referido: item.plan,
          monto_mensual_referido: item.monto_mensual,
          created_at: item.created_at,
          activado_at: item.activado_at,
        })),
        loading: false,
        error: null,
        available: true,
      });
      return;
    }

    if (error && !esFuncionNoDisponible(error)) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      return;
    }

    const { data: legacy, error: legacyError } = await supabase
      .from("referidos")
      .select("*")
      .eq("referidor_tenant_id", tenantId)
      .order("created_at", { ascending: false });

    setState({
      programa: null,
      referidos: (legacy as Referido[]) ?? [],
      loading: false,
      error: legacyError?.message ?? null,
      available: false,
    });
  }, [tenantId]);

  useEffect(() => {
    void fetchPrograma();
  }, [fetchPrograma]);

  return { ...state, refetch: fetchPrograma };
}

/** Cuenta del mes con descuento por referidos (liviana para billetera/plan). */
export function useCuentaReferido(tenantId: string | null | undefined) {
  const [cuenta, setCuenta] = useState<CuentaReferidos | null>(null);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [available, setAvailable] = useState(true);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setCuenta(null);
      setLoading(false);
      setAvailable(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("calcular_cuenta_referidos", {
      p_tenant_id: tenantId,
    });
    if (error) {
      setAvailable(!esFuncionNoDisponible(error));
      setCuenta(null);
    } else {
      setCuenta((data as CuentaReferidos) ?? null);
      setAvailable(true);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { cuenta, loading, available, refetch };
}

export interface PagoMovilSocioInput {
  banco: string;
  cedula: string;
  telefono: string;
}

export async function guardarPagoMovilSocio(
  input: PagoMovilSocioInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("guardar_pago_movil_socio", {
    p_banco: input.banco,
    p_cedula: input.cedula,
    p_telefono: input.telefono,
  });
  return { error: error?.message ?? null };
}

export interface ConfigReferidosInput {
  descuento_por_referido_pct: number;
  meta_referidos_gratis: number;
  comision_socio_pct: number;
  precio_plan_estandar: number;
  precio_plan_profesional: number;
  precio_plan_premium: number;
}

/** Configuracion editable del programa de referidos (solo superadmin). */
export function useConfigReferidos() {
  const [config, setConfig] = useState<ConfigReferidos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("config_referidos")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setAvailable(!esFuncionNoDisponible(queryError));
      setConfig(null);
    } else {
      setConfig((data as ConfigReferidos | null) ?? null);
      setError(null);
      setAvailable(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const guardar = useCallback(async (input: ConfigReferidosInput) => {
    setSaving(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("actualizar_config_referidos", {
      p_descuento_por_referido_pct: input.descuento_por_referido_pct,
      p_meta_referidos_gratis: input.meta_referidos_gratis,
      p_comision_socio_pct: input.comision_socio_pct,
      p_precio_plan_estandar: input.precio_plan_estandar,
      p_precio_plan_profesional: input.precio_plan_profesional,
      p_precio_plan_premium: input.precio_plan_premium,
    });
    setSaving(false);

    if (rpcError) {
      const message = esFuncionNoDisponible(rpcError)
        ? "La configuracion administrativa aun no esta disponible. Aplica la migracion 2026-11-14."
        : rpcError.message;
      setError(message);
      setAvailable(!esFuncionNoDisponible(rpcError));
      return { error: message };
    }

    setConfig((data as ConfigReferidos) ?? null);
    setAvailable(true);
    return { error: null };
  }, []);

  return { config, loading, saving, error, available, refetch, guardar };
}

interface AdminReferidosState {
  rows: AdminReferidoRow[];
  detalles: AdminReferidoDetalle[];
  loading: boolean;
  error: string | null;
  available: boolean;
}

/** Bandeja del superadmin: descuentos, socios y comisiones por pagar. */
export function useAdminReferidos(options?: { generarComisiones?: boolean }) {
  const generarComisiones = options?.generarComisiones ?? true;
  const [state, setState] = useState<AdminReferidosState>({
    rows: [],
    detalles: [],
    loading: true,
    error: null,
    available: true,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (generarComisiones) {
      await supabase.rpc("generar_comisiones_mes_referidos");
    }

    const [rowsRes, detallesRes] = await Promise.all([
      supabase.rpc("listar_referidos_admin"),
      supabase.rpc("listar_referidos_detalle_admin"),
    ]);

    const error = rowsRes.error ?? detallesRes.error;

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
        available: esFuncionNoDisponible(error) ? false : prev.available,
      }));
      return;
    }

    setState({
      rows: (rowsRes.data as AdminReferidoRow[]) ?? [],
      detalles: (detallesRes.data as AdminReferidoDetalle[]) ?? [],
      loading: false,
      error: null,
      available: true,
    });
  }, [generarComisiones]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const pagarComisiones = useCallback(
    async (
      referidorTenantId: string,
      input: { metodo: string; referencia?: string; notas?: string }
    ) => {
      const { error } = await supabase.rpc("pagar_comisiones_referido", {
        p_referidor_tenant_id: referidorTenantId,
        p_metodo: input.metodo,
        p_referencia: input.referencia ?? null,
        p_notas: input.notas ?? null,
      });
      if (!error) await refetch();
      return { error: error?.message ?? null };
    },
    [refetch]
  );

  const totalPendiente = state.rows.reduce((sum, row) => sum + (row.comisiones_pendientes ?? 0), 0);
  const alertasPago = state.rows.filter((row) => (row.comisiones_pendientes ?? 0) > 0);

  return { ...state, totalPendiente, alertasPago, refetch, pagarComisiones };
}
