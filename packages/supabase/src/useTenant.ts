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
