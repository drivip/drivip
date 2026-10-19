import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Cliente } from "@drivip/types";

export interface ClienteConRed extends Cliente {
  tenant_nombre: string | null;
  tenant_slug: string | null;
  red_conductores: RedConductorEntry[];
}

export interface RedConductorEntry {
  id: string;
  conductor_tenant_id: string;
  conductor_nombre: string | null;
  conductor_slug: string | null;
  apodo: string | null;
  favorito: boolean;
  notificaciones_activas: boolean;
  agregado_at: string;
}

interface UseClientesState {
  clientes: ClienteConRed[];
  loading: boolean;
  error: string | null;
}

export function useClientes() {
  const [state, setState] = useState<UseClientesState>({
    clientes: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientesError) {
      setState({ clientes: [], loading: false, error: clientesError.message });
      return;
    }

    const profileIds = (clientesData ?? [])
      .map((c) => c.profile_id)
      .filter((id): id is string => id !== null);

    let redData: any[] = [];
    if (profileIds.length > 0) {
      const { data } = await supabase
        .from("red_cliente")
        .select("*")
        .in("cliente_id", profileIds);
      redData = data ?? [];
    }

    const tenantIds = [
      ...new Set([
        ...(clientesData ?? []).map((c) => c.tenant_id),
        ...redData.map((r) => r.conductor_tenant_id),
      ]),
    ];

    let tenantsMap: Record<string, { nombre: string; slug: string }> = {};
    if (tenantIds.length > 0) {
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, nombre, slug")
        .in("id", tenantIds);
      (tenantsData ?? []).forEach((t: any) => {
        tenantsMap[t.id] = { nombre: t.nombre, slug: t.slug };
      });
    }

    const clientes: ClienteConRed[] = (clientesData ?? []).map((c: any) => {
      const red = redData
        .filter((r) => r.cliente_id === c.profile_id)
        .map((r) => ({
          id: r.id,
          conductor_tenant_id: r.conductor_tenant_id,
          conductor_nombre: tenantsMap[r.conductor_tenant_id]?.nombre ?? null,
          conductor_slug: tenantsMap[r.conductor_tenant_id]?.slug ?? null,
          apodo: r.apodo,
          favorito: r.favorito,
          notificaciones_activas: r.notificaciones_activas,
          agregado_at: r.agregado_at,
        }));

      return {
        ...c,
        tenant_nombre: tenantsMap[c.tenant_id]?.nombre ?? null,
        tenant_slug: tenantsMap[c.tenant_id]?.slug ?? null,
        red_conductores: red,
      };
    });

    setState({ clientes, loading: false, error: null });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => fetchAll(), [fetchAll]);

  return { ...state, refetch };
}

/** Clientes registrados en el tenant del conductor (panel del conductor). */
export function useClientesTenant(tenantId: string | null | undefined) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setClientes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("clientes")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setClientes([]);
    } else {
      setClientes((data as Cliente[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  return { clientes, loading, error, refetch: fetchAll };
}

export function useClienteDetail(clienteId: string | null) {
  const [cliente, setCliente] = useState<ClienteConRed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clienteId) {
      setCliente(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      const { data: clienteData, error: clienteErr } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", clienteId)
        .single();

      if (cancelled) return;
      if (clienteErr || !clienteData) {
        setCliente(null);
        setError(clienteErr?.message || "No encontrado");
        setLoading(false);
        return;
      }

      const redQuery = clienteData.profile_id
        ? supabase.from("red_cliente").select("*").eq("cliente_id", clienteData.profile_id)
        : Promise.resolve({ data: [] as any[], error: null });

      const [redRes, tenantRes] = await Promise.all([
        redQuery,
        supabase.from("tenants").select("id, nombre, slug").eq("id", clienteData.tenant_id).single(),
      ]);

      if (cancelled) return;

      const tenantInfo = tenantRes.data as { nombre: string; slug: string } | null;

      const red = (redRes.data ?? []).map((r: any) => ({
        id: r.id,
        conductor_tenant_id: r.conductor_tenant_id,
        conductor_nombre: null as string | null,
        conductor_slug: null as string | null,
        apodo: r.apodo,
        favorito: r.favorito,
        notificaciones_activas: r.notificaciones_activas,
        agregado_at: r.agregado_at,
      }));

      const conductorTenantIds = red.map((r) => r.conductor_tenant_id);
      if (conductorTenantIds.length > 0) {
        const { data: conductoresData } = await supabase
          .from("tenants")
          .select("id, nombre, slug")
          .in("id", conductorTenantIds);
        const cMap: Record<string, { nombre: string; slug: string }> = {};
        (conductoresData ?? []).forEach((t: any) => {
          cMap[t.id] = { nombre: t.nombre, slug: t.slug };
        });
        red.forEach((r) => {
          r.conductor_nombre = cMap[r.conductor_tenant_id]?.nombre ?? null;
          r.conductor_slug = cMap[r.conductor_tenant_id]?.slug ?? null;
        });
      }

      setCliente({
        ...(clienteData as Cliente),
        tenant_nombre: tenantInfo?.nombre ?? null,
        tenant_slug: tenantInfo?.slug ?? null,
        red_conductores: red,
      });
      setLoading(false);
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [clienteId]);

  return { cliente, loading, error };
}
