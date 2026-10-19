import { useState, useEffect } from "react";
import { supabase } from "./client";
import type { PublicTenant } from "@drivip/types";

interface PublicTenantState {
  tenant: PublicTenant | null;
  loading: boolean;
  error: string | null;
}

/**
 * Busca un conductor por su slug mediante la RPC publica get_tenant_by_slug.
 * No requiere sesion y no depende de RLS (la funcion es SECURITY DEFINER).
 */
export function useTenantBySlug(slug: string | null) {
  const [state, setState] = useState<PublicTenantState>({
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
    setState((prev) => ({ ...prev, loading: true, error: null }));

    supabase
      .rpc("get_tenant_by_slug", { p_slug: slug.trim() })
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ tenant: null, loading: false, error: error.message });
        } else if (!data) {
          setState({ tenant: null, loading: false, error: "No encontrado" });
        } else {
          setState({ tenant: data as PublicTenant, loading: false, error: null });
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}
