-- =============================================
-- Migracion: tasa de cambio oficial (BCV)
-- Fecha: 2026-10-22
-- Descripcion:
--   Almacena la tasa oficial USD->VES publicada por el BCV.
--   La escribe la Edge Function update-bcv-rate (service role) y la
--   leen las apps cliente / conductor mediante la RPC get_tasa_actual.
--
--   - Tabla tasas_cambio (una fila por moneda y fecha).
--   - RLS: lectura publica, escritura solo service role.
--   - RPC get_tasa_actual: devuelve la ultima tasa registrada.
-- =============================================

-- =============================================
-- 1. Tabla tasas_cambio
-- =============================================
CREATE TABLE IF NOT EXISTS tasas_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moneda TEXT NOT NULL DEFAULT 'USD',
    tasa NUMERIC(14,4) NOT NULL CHECK (tasa > 0),
    fuente TEXT,
    fecha DATE NOT NULL DEFAULT (timezone('America/Caracas', now()))::date,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (moneda, fecha)
);

CREATE INDEX IF NOT EXISTS idx_tasas_cambio_lookup
    ON tasas_cambio (moneda, fecha DESC);

-- =============================================
-- 2. RLS: lectura publica (anon / authenticated).
--    Escritura unicamente via service role (Edge Function),
--    que omite RLS.
-- =============================================
ALTER TABLE tasas_cambio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasas_cambio_read" ON tasas_cambio;
CREATE POLICY "tasas_cambio_read"
ON tasas_cambio FOR SELECT
USING (true);

-- =============================================
-- 3. get_tasa_actual: ultima tasa registrada.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_tasa_actual(p_moneda text DEFAULT 'USD')
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'moneda', t.moneda,
        'tasa', t.tasa,
        'fecha', t.fecha,
        'fuente', t.fuente,
        'actualizado_at', t.updated_at
    )
    FROM tasas_cambio t
    WHERE t.moneda = COALESCE(NULLIF(p_moneda, ''), 'USD')
    ORDER BY t.fecha DESC, t.updated_at DESC
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tasa_actual(text) TO anon, authenticated;

-- =============================================
-- 4. (Opcional) Programar la actualizacion diaria con pg_cron + pg_net.
--    Requiere las extensiones pg_cron y pg_net habilitadas desde el
--    dashboard de Supabase (Database > Extensions). Ajusta tu URL y
--    reemplaza <CRON_SECRET> por el valor del secreto CRON_SECRET.
--
-- SELECT cron.schedule(
--     'update-bcv-rate',
--     '0 12 * * *',
--     $$
--     SELECT net.http_post(
--         url := 'https://myvhzoaktrpuntbrfwux.supabase.co/functions/v1/update-bcv-rate',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'x-cron-secret', '<CRON_SECRET>'
--         ),
--         body := '{}'::jsonb
--     );
--     $$
-- );
-- =============================================
