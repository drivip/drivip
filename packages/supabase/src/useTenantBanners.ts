import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { TenantBanner } from "@drivip/types";

/** Banners de todos los tenants (panel superadmin). */
export function useAllBanners() {
  const [banners, setBanners] = useState<TenantBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tenant_banners")
      .select("*")
      .order("created_at", { ascending: false });
    setBanners((data as TenantBanner[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const crearBanner = useCallback(async (banner: Omit<TenantBanner, "id" | "created_at">) => {
    const { data, error } = await supabase.from("tenant_banners").insert(banner).select().single();
    if (!error && data) setBanners((prev) => [data as TenantBanner, ...prev]);
    return !error;
  }, []);

  const toggleBanner = useCallback(async (id: string, activo: boolean) => {
    const { error } = await supabase.from("tenant_banners").update({ activo }).eq("id", id);
    if (!error) setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, activo } : b)));
    return !error;
  }, []);

  const eliminarBanner = useCallback(async (id: string) => {
    const { error } = await supabase.from("tenant_banners").delete().eq("id", id);
    if (!error) setBanners((prev) => prev.filter((b) => b.id !== id));
    return !error;
  }, []);

  return { banners, loading, refetch, crearBanner, toggleBanner, eliminarBanner };
}

export function useTenantBanners(tenantId: string | null) {
  const [banners, setBanners] = useState<TenantBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setBanners([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("tenant_banners")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setBanners((data as TenantBanner[]) ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [tenantId]);

  const crearBanner = useCallback(async (banner: Omit<TenantBanner, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("tenant_banners")
      .insert(banner)
      .select()
      .single();

    if (!error && data) {
      setBanners((prev) => [data as TenantBanner, ...prev]);
    }
    return !error;
  }, []);

  const toggleBanner = useCallback(async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from("tenant_banners")
      .update({ activo })
      .eq("id", id);

    if (!error) {
      setBanners((prev) => prev.map((b) => b.id === id ? { ...b, activo } : b));
    }
    return !error;
  }, []);

  const eliminarBanner = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("tenant_banners")
      .delete()
      .eq("id", id);

    if (!error) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
    }
    return !error;
  }, []);

  return { banners, loading, crearBanner, toggleBanner, eliminarBanner };
}
