import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function caracasDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(d);
}

interface RateResult {
  tasa: number;
  fuente: string;
}

/** Fuente primaria: DolarApi Venezuela (endpoint oficial / BCV). */
async function fetchFromDolarApi(): Promise<RateResult | null> {
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json() as {
      promedio?: number | null;
      venta?: number | null;
      compra?: number | null;
    };
    const tasa = Number(data.promedio ?? data.venta ?? data.compra);
    if (!Number.isFinite(tasa) || tasa <= 0) return null;
    return { tasa, fuente: "dolarapi.oficial" };
  } catch {
    return null;
  }
}

/** Respaldo: scraping de la pagina del BCV. */
async function fetchFromBcv(): Promise<RateResult | null> {
  try {
    const res = await fetch("https://www.bcv.org.ve/", {
      headers: {
        Accept: "text/html",
        "User-Agent": "DrivipApp/2.0 (drivipapp@gmail.com)",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/id="dolar"[\s\S]*?<strong>\s*([\d.,]+)\s*<\/strong>/i);
    if (!match) return null;
    const tasa = Number(match[1].replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(tasa) || tasa <= 0) return null;
    return { tasa, fuente: "bcv.org.ve" };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "supabase_not_configured" }, 500);

  // Proteccion: si CRON_SECRET esta definido, exigir el header coincidente.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "unauthorized" }, 401);
  }

  let moneda = "USD";
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body?.moneda) moneda = String(body.moneda);
    } catch { /* body opcional */ }
  }

  const rate = (await fetchFromDolarApi()) ?? (await fetchFromBcv());
  if (!rate) return json({ error: "rate_unavailable" }, 502);

  const fecha = caracasDate();
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from("tasas_cambio")
    .upsert(
      { moneda, tasa: rate.tasa, fuente: rate.fuente, fecha, updated_at: new Date().toISOString() },
      { onConflict: "moneda,fecha" },
    )
    .select()
    .single();

  if (error) return json({ error: "upsert_failed", detail: error.message }, 500);

  return json({ ok: true, tasa: rate.tasa, fuente: rate.fuente, fecha, row: data });
});
