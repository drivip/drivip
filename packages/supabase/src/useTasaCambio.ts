import { useState, useEffect, useCallback } from "react";
import { supabase } from "./client";
import type { TasaCambio } from "@drivip/types";

/**
 * Lee la ultima tasa oficial (BCV) registrada en `tasas_cambio`
 * mediante la RPC publica get_tasa_actual.
 *
 * Mientras no exista una tasa real, `tasa` queda en null y los
 * consumidores deben caer al respaldo TASA_BCV_REFERENCIA.
 */
export function useTasaCambio(moneda = "USD") {
  const [tasa, setTasa] = useState<number | null>(null);
  const [fuente, setFuente] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasa = useCallback(async () => {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_tasa_actual", { p_moneda: moneda });
    if (rpcError) {
      setError(rpcError.message);
      setTasa(null);
      setLoading(false);
      return;
    }
    if (!data) {
      setTasa(null);
      setFuente(null);
      setFecha(null);
      setError(null);
      setLoading(false);
      return;
    }
    const raw = data as TasaCambio;
    setTasa(Number(raw.tasa));
    setFuente(raw.fuente);
    setFecha(raw.fecha);
    setError(null);
    setLoading(false);
  }, [moneda]);

  useEffect(() => { void fetchTasa(); }, [fetchTasa]);

  return { tasa, fuente, fecha, loading, error, refetch: fetchTasa };
}
