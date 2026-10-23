import { useCallback, useEffect, useState } from "react";
import { supabase } from "./client";

export interface SuperadminStats {
  totalTenants: number;
  activeTenants: number;
  totalClients: number;
  mrr: number;
  ridesToday: number;
  completedToday: number;
}

const EMPTY_STATS: SuperadminStats = {
  totalTenants: 0,
  activeTenants: 0,
  totalClients: 0,
  mrr: 0,
  ridesToday: 0,
  completedToday: 0,
};

export function useSuperadminStats(enabled = true) {
  const [stats, setStats] = useState<SuperadminStats | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_superadmin_stats");
    if (rpcError) {
      setError(rpcError.message);
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }
    const raw = (data ?? {}) as Record<string, unknown>;
    setStats({
      totalTenants: Number(raw.total_tenants ?? 0),
      activeTenants: Number(raw.active_tenants ?? 0),
      totalClients: Number(raw.total_clients ?? 0),
      mrr: Number(raw.mrr ?? 0),
      ridesToday: Number(raw.rides_today ?? 0),
      completedToday: Number(raw.completed_today ?? 0),
    });
    setError(null);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { stats, loading, error, refetch };
}
