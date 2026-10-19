import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Tenant } from "@drivip/types";

interface TenantState {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

export function useTenant(slug: string | null) {
  const [state, setState] = useState<TenantState>({
    tenant: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!slug) {
      setState({ tenant: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ tenant: null, loading: false, error: error.message });
        } else {
          setState({ tenant: data as Tenant, loading: false, error: null });
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}

/**
 * Resuelve el tenant del usuario autenticado a partir de su perfil.
 * El registro guarda profiles.tenant_id, que es la unica relacion
 * confiable entre la cuenta de Auth y el tenant del conductor.
 */
export function useMiTenant(userId: string | null | undefined) {
  const [state, setState] = useState<TenantState>({
    tenant: null,
    loading: Boolean(userId),
    error: null,
  });

  const [reloadKey, setReloadKey] = useState(0);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) {
      setState({ tenant: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (profileError || !profile?.tenant_id) {
        setState({ tenant: null, loading: false, error: profileError?.message ?? null });
        return;
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single();

      if (cancelled) return;

      if (error) {
        setState({ tenant: null, loading: false, error: error.message });
      } else {
        setState({ tenant: data as Tenant, loading: false, error: null });
      }
    })();

    return () => { cancelled = true; };
  }, [userId, reloadKey]);

  return { ...state, refetch };
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setTenants((data as Tenant[]) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { tenants, loading };
}
