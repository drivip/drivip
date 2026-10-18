import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { Tenant, Carrera, PluginActivo, TenantBanner, TenantNotificacion } from "@drivip/types";

interface TenantDetailState {
  tenant: Tenant | null;
  carrerasRecientes: Carrera[];
  plugins: PluginActivo[];
  banners: TenantBanner[];
  notificaciones: TenantNotificacion[];
  loading: boolean;
  error: string | null;
}

export function useTenantDetail(tenantId: string | null) {
  const [state, setState] = useState<TenantDetailState>({
    tenant: null,
    carrerasRecientes: [],
    plugins: [],
    banners: [],
    notificaciones: [],
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    const [tenantRes, carrerasRes, pluginsRes, bannersRes, notifRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenantId).single(),
      supabase.from("carreras").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(20),
      supabase.from("plugins_activos").select("*").eq("tenant_id", tenantId),
      supabase.from("tenant_banners").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("tenant_notificaciones").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50),
    ]);

    const tenant = tenantRes.data as Tenant | null;
    const carreras = (carrerasRes.data as Carrera[]) ?? [];
    const plugins = (pluginsRes.data as PluginActivo[]) ?? [];
    const banners = (bannersRes.data as TenantBanner[]) ?? [];
    const notificaciones = (notifRes.data as TenantNotificacion[]) ?? [];

    const error = tenantRes.error?.message || carrerasRes.error?.message || pluginsRes.error?.message || bannersRes.error?.message || notifRes.error?.message || null;

    setState({
      tenant,
      carrerasRecientes: carreras,
      plugins,
      banners,
      notificaciones,
      loading: false,
      error,
    });
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = useCallback(() => fetchAll(), [fetchAll]);

  return { ...state, refetch };
}
