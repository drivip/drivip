import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Cupon, CuponCliente, TipoCupon } from "@drivip/types";
import { supabase } from "./client";

export interface NuevoCupon {
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  valido_hasta?: string | null;
}

export interface ResultadoCupon {
  ok: boolean;
  error?: string;
  count?: number;
}

export interface ResultadoCanje {
  ok: boolean;
  error?: string;
  codigo?: string;
  tipo?: TipoCupon;
  valor?: number;
  conductor?: string;
}

export interface ResultadoValidarCupon {
  ok: boolean;
  error?: string;
  cupon_id?: string;
  codigo?: string;
  tipo?: TipoCupon;
  valor?: number;
  conductor?: string;
  valido_hasta?: string | null;
}

/** Valida un codigo de cupon del conductor elegido sin consumirlo. */
export async function validarCuponCodigo(
  codigo: string,
  conductorTenantId: string
): Promise<ResultadoValidarCupon> {
  const { data, error } = await supabase.rpc("validar_cupon_codigo", {
    p_cupon_codigo: codigo.trim().toUpperCase(),
    p_conductor_tenant_id: conductorTenantId,
  });
  if (error) return { ok: false, error: error.message };
  return (
    (data as ResultadoValidarCupon | null) ?? {
      ok: false,
      error: "cupon_no_encontrado",
    }
  );
}

function normalizarCupon(row: Cupon): Cupon {
  return {
    ...row,
    valor: Number(row.valor),
    envios: Number(row.envios ?? 0),
    canjeados: Number(row.canjeados ?? 0),
  };
}

function normalizarCuponCliente(row: CuponCliente): CuponCliente {
  return { ...row, valor: Number(row.valor) };
}

export function useCuponesConductor(tenantId?: string | null) {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setCupones([]);
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("listar_cupones_conductor");
    if (rpcError) {
      setError(rpcError.message);
      setCupones([]);
    } else {
      setCupones(((data as Cupon[] | null) ?? []).map(normalizarCupon));
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!tenantId) return;

    const programarRefetch = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => { void fetchAll(); }, 180);
    };

    const channel = supabase
      .channel(`cupones-conductor-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cupones",
          filter: `tenant_id=eq.${tenantId}`,
        },
        programarRefetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cupon_envios",
          filter: `tenant_id=eq.${tenantId}`,
        },
        programarRefetch
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchAll]);

  const crearCupon = useCallback(
    async (input: NuevoCupon): Promise<ResultadoCupon> => {
      if (!tenantId) return { ok: false, error: "Falta el conductor" };

      const codigo = input.codigo.trim().toUpperCase().replace(/\s+/g, "");
      const { data, error: insertError } = await supabase
        .from("cupones")
        .insert({
          tenant_id: tenantId,
          codigo,
          tipo: input.tipo,
          valor: input.valor,
          valido_hasta: input.valido_hasta ?? null,
        })
        .select()
        .single();

      if (insertError) return { ok: false, error: insertError.message };

      setCupones((prev) => [
        normalizarCupon({ ...(data as Cupon), envios: 0, canjeados: 0 }),
        ...prev,
      ]);
      return { ok: true };
    },
    [tenantId]
  );

  const actualizarCupon = useCallback(
    async (id: string, cambios: Partial<Pick<Cupon, "activo" | "codigo" | "tipo" | "valor" | "valido_hasta">>) => {
      const { error: updateError } = await supabase
        .from("cupones")
        .update({ ...cambios, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) return { ok: false, error: updateError.message };

      setCupones((prev) =>
        prev.map((cupon) => (cupon.id === id ? { ...cupon, ...cambios } : cupon))
      );
      return { ok: true };
    },
    []
  );

  const eliminarCupon = useCallback(async (id: string): Promise<ResultadoCupon> => {
    const { error: deleteError } = await supabase.from("cupones").delete().eq("id", id);
    if (deleteError) return { ok: false, error: deleteError.message };
    setCupones((prev) => prev.filter((cupon) => cupon.id !== id));
    return { ok: true };
  }, []);

  const enviarCupon = useCallback(
    async (cuponId: string, clienteIds: string[]): Promise<ResultadoCupon> => {
      if (clienteIds.length === 0) {
        return { ok: false, error: "Selecciona al menos un cliente" };
      }

      const { data, error: rpcError } = await supabase.rpc("enviar_cupon", {
        p_cupon_id: cuponId,
        p_cliente_ids: clienteIds,
      });

      if (rpcError) return { ok: false, error: rpcError.message };

      await fetchAll();
      return { ok: true, count: Number(data ?? 0) };
    },
    [fetchAll]
  );

  return {
    cupones,
    loading,
    error,
    refetch: fetchAll,
    crearCupon,
    actualizarCupon,
    eliminarCupon,
    enviarCupon,
  };
}

export function useCuponesCliente() {
  const [cupones, setCupones] = useState<CuponCliente[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canjeando, setCanjeando] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("listar_cupones_cliente");
    if (rpcError) {
      setError(rpcError.message);
      setCupones([]);
    } else {
      setCupones(((data as CuponCliente[] | null) ?? []).map(normalizarCuponCliente));
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    void fetchAll();
    return () => { cancelled = true; };
  }, [fetchAll]);

  useEffect(() => {
    if (!userId) return;

    const programarRefetch = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => { void fetchAll(); }, 180);
    };

    const channel = supabase
      .channel(`cupones-cliente-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cupon_envios",
          filter: `cliente_id=eq.${userId}`,
        },
        programarRefetch
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAll]);

  const canjearCupon = useCallback(async (cuponId: string): Promise<ResultadoCanje> => {
    setCanjeando(cuponId);
    const { data, error: rpcError } = await supabase.rpc("canjear_cupon", {
      p_cupon_id: cuponId,
    });
    setCanjeando(null);

    if (rpcError) return { ok: false, error: rpcError.message };

    const resultado = (data as ResultadoCanje | null) ?? { ok: false };
    if (resultado.ok) {
      setCupones((prev) =>
        prev.map((cupon) =>
          cupon.cupon_id === cuponId
            ? { ...cupon, estado: "usado", usado_at: new Date().toISOString() }
            : cupon
        )
      );
    }
    return resultado;
  }, []);

  const disponibles = useMemo(
    () => cupones.filter((cupon) => cupon.estado === "disponible"),
    [cupones]
  );
  const usados = useMemo(
    () => cupones.filter((cupon) => cupon.estado !== "disponible"),
    [cupones]
  );

  return {
    cupones,
    disponibles,
    usados,
    userId,
    loading,
    error,
    canjeando,
    canjearCupon,
    refetch: fetchAll,
  };
}
