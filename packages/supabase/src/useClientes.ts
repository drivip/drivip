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

interface ProfileRow {
  id: string;
  tenant_id: string | null;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string;
}

interface ClienteRow {
  profile_id: string | null;
  tenant_id: string;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  total_carreras: number;
}

function nombreCompleto(profile: ProfileRow): string {
  return (
    [profile.nombre, profile.apellido].filter(Boolean).join(" ").trim() ||
    profile.email ||
    "Cliente"
  );
}

async function getTenantsMap(ids: string[]) {
  const map: Record<string, { nombre: string; slug: string }> = {};
  if (ids.length === 0) return map;

  const { data } = await supabase
    .from("tenants")
    .select("id, nombre, slug")
    .in("id", ids);

  (data ?? []).forEach((t: any) => {
    map[t.id] = { nombre: t.nombre, slug: t.slug };
  });
  return map;
}

export function useClientes() {
  const [state, setState] = useState<UseClientesState>({
    clientes: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, tenant_id, nombre, apellido, telefono, email, created_at")
      .eq("rol", "cliente")
      .order("created_at", { ascending: false });

    if (profilesError) {
      setState({ clientes: [], loading: false, error: profilesError.message });
      return;
    }

    const profiles = (profilesData ?? []) as ProfileRow[];
    const profileIds = profiles.map((p) => p.id);

    let redData: any[] = [];
    let clientesData: ClienteRow[] = [];

    if (profileIds.length > 0) {
      const [redRes, clientesRes] = await Promise.all([
        supabase
          .from("red_cliente")
          .select("*")
          .in("cliente_id", profileIds)
          .order("agregado_at", { ascending: false }),
        supabase
          .from("clientes")
          .select("profile_id, tenant_id, direccion, lat, lng, total_carreras")
          .in("profile_id", profileIds),
      ]);
      redData = redRes.data ?? [];
      clientesData = (clientesRes.data ?? []) as ClienteRow[];
    }

    const tenantIds = [
      ...new Set([
        ...profiles.map((p) => p.tenant_id).filter((id): id is string => !!id),
        ...redData.map((r) => r.conductor_tenant_id),
        ...clientesData.map((c) => c.tenant_id),
      ]),
    ];
    const tenantsMap = await getTenantsMap(tenantIds);

    const clientes: ClienteConRed[] = profiles.map((p) => {
      const perfilRed = redData.filter((r) => r.cliente_id === p.id);
      const perfilClientes = clientesData.filter((c) => c.profile_id === p.id);
      const primaryTenantId =
        perfilRed[0]?.conductor_tenant_id ??
        perfilClientes[0]?.tenant_id ??
        p.tenant_id ??
        null;

      const red = perfilRed.map((r) => ({
        id: r.id,
        conductor_tenant_id: r.conductor_tenant_id,
        conductor_nombre: tenantsMap[r.conductor_tenant_id]?.nombre ?? null,
        conductor_slug: tenantsMap[r.conductor_tenant_id]?.slug ?? null,
        apodo: r.apodo,
        favorito: r.favorito,
        notificaciones_activas: r.notificaciones_activas,
        agregado_at: r.agregado_at,
      }));

      const firstCliente = perfilClientes[0];

      return {
        id: p.id,
        tenant_id: primaryTenantId,
        profile_id: p.id,
        nombre: nombreCompleto(p),
        telefono: p.telefono,
        email: p.email,
        direccion: firstCliente?.direccion ?? null,
        lat: firstCliente?.lat ?? null,
        lng: firstCliente?.lng ?? null,
        total_carreras: perfilClientes.reduce(
          (sum, c) => sum + (c.total_carreras || 0),
          0
        ),
        created_at: p.created_at,
        tenant_nombre: primaryTenantId
          ? tenantsMap[primaryTenantId]?.nombre ?? null
          : null,
        tenant_slug: primaryTenantId
          ? tenantsMap[primaryTenantId]?.slug ?? null
          : null,
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

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, tenant_id, nombre, apellido, telefono, email, created_at")
        .eq("id", clienteId)
        .single();

      if (cancelled) return;
      if (profileErr || !profileData) {
        setCliente(null);
        setError(profileErr?.message || "No encontrado");
        setLoading(false);
        return;
      }

      const profile = profileData as ProfileRow;

      const [redRes, clientesRes] = await Promise.all([
        supabase
          .from("red_cliente")
          .select("*")
          .eq("cliente_id", profile.id)
          .order("agregado_at", { ascending: false }),
        supabase
          .from("clientes")
          .select("profile_id, tenant_id, direccion, lat, lng, total_carreras")
          .eq("profile_id", profile.id),
      ]);

      if (cancelled) return;

      const redData = redRes.data ?? [];
      const clientesData = (clientesRes.data ?? []) as ClienteRow[];
      const tenantIds = [
        ...new Set([
          ...(profile.tenant_id ? [profile.tenant_id] : []),
          ...redData.map((r: any) => r.conductor_tenant_id),
          ...clientesData.map((c) => c.tenant_id),
        ]),
      ];
      const tenantsMap = await getTenantsMap(tenantIds);

      if (cancelled) return;

      const red = redData.map((r: any) => ({
        id: r.id,
        conductor_tenant_id: r.conductor_tenant_id,
        conductor_nombre: tenantsMap[r.conductor_tenant_id]?.nombre ?? null,
        conductor_slug: tenantsMap[r.conductor_tenant_id]?.slug ?? null,
        apodo: r.apodo,
        favorito: r.favorito,
        notificaciones_activas: r.notificaciones_activas,
        agregado_at: r.agregado_at,
      }));

      const primaryTenantId =
        redData[0]?.conductor_tenant_id ??
        clientesData[0]?.tenant_id ??
        profile.tenant_id ??
        null;
      const firstCliente = clientesData[0];

      setCliente({
        id: profile.id,
        tenant_id: primaryTenantId,
        profile_id: profile.id,
        nombre: nombreCompleto(profile),
        telefono: profile.telefono,
        email: profile.email,
        direccion: firstCliente?.direccion ?? null,
        lat: firstCliente?.lat ?? null,
        lng: firstCliente?.lng ?? null,
        total_carreras: clientesData.reduce(
          (sum, c) => sum + (c.total_carreras || 0),
          0
        ),
        created_at: profile.created_at,
        tenant_nombre: primaryTenantId
          ? tenantsMap[primaryTenantId]?.nombre ?? null
          : null,
        tenant_slug: primaryTenantId
          ? tenantsMap[primaryTenantId]?.slug ?? null
          : null,
        red_conductores: red,
      });
      setLoading(false);
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [clienteId]);

  return { cliente, loading, error };
}
