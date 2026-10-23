-- Fase 1: posicion actual en una sola fila, reporte con throttle y retencion.

CREATE TABLE IF NOT EXISTS public.conductor_ubicacion_actual (
    conductor_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    carrera_id uuid REFERENCES public.carreras(id) ON DELETE SET NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    velocidad double precision,
    direccion double precision,
    timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubicacion_actual_tenant
    ON public.conductor_ubicacion_actual(tenant_id);

ALTER TABLE public.conductor_ubicacion_actual ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.conductor_ubicacion_actual FROM anon, authenticated;
GRANT SELECT ON public.conductor_ubicacion_actual TO authenticated;

DROP POLICY IF EXISTS "ubicacion_actual_conductor_select" ON public.conductor_ubicacion_actual;
CREATE POLICY "ubicacion_actual_conductor_select"
ON public.conductor_ubicacion_actual FOR SELECT
TO authenticated
USING (
    conductor_id = public.tenant_id()
    OR EXISTS (
        SELECT 1 FROM public.red_cliente rc
        WHERE rc.cliente_id = auth.uid()
          AND rc.conductor_tenant_id = conductor_ubicacion_actual.conductor_id
    )
    OR public.is_superadmin()
);

CREATE OR REPLACE FUNCTION public.haversine_km(
    p_lat1 double precision, p_lng1 double precision,
    p_lat2 double precision, p_lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT 6371 * 2 * asin(sqrt(
        power(sin(radians(p_lat2 - p_lat1) / 2), 2)
        + cos(radians(p_lat1)) * cos(radians(p_lat2))
        * power(sin(radians(p_lng2 - p_lng1) / 2), 2)
    ));
$$;

CREATE OR REPLACE FUNCTION public.reportar_ubicacion(
    p_lat double precision,
    p_lng double precision,
    p_velocidad double precision DEFAULT NULL,
    p_direccion double precision DEFAULT NULL,
    p_carrera_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant uuid := public.tenant_id();
    v_last record;
    v_dist double precision;
    v_carrera uuid := p_carrera_id;
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    IF p_lat IS NULL OR p_lng IS NULL
       OR p_lat < -90 OR p_lat > 90
       OR p_lng < -180 OR p_lng > 180 THEN
        RAISE EXCEPTION 'ubicacion_invalida';
    END IF;

    IF v_carrera IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.carreras c
        WHERE c.id = v_carrera
          AND c.tenant_id = v_tenant
          AND c.estado IN ('aceptada', 'en_curso')
    ) THEN
        v_carrera := NULL;
    END IF;

    SELECT lat, lng, timestamp
    INTO v_last
    FROM public.ubicaciones
    WHERE conductor_id = v_tenant
    ORDER BY timestamp DESC
    LIMIT 1;

    v_dist := CASE
        WHEN v_last IS NULL THEN NULL
        ELSE public.haversine_km(v_last.lat, v_last.lng, p_lat, p_lng)
    END;

    -- Historial: minimo 12 segundos o 40 metros.
    IF v_last IS NULL
       OR now() - v_last.timestamp >= interval '12 seconds'
       OR COALESCE(v_dist, 0) >= 0.04 THEN
        INSERT INTO public.ubicaciones (
            conductor_id, tenant_id, carrera_id, lat, lng,
            velocidad, direccion, timestamp
        ) VALUES (
            v_tenant, v_tenant, v_carrera, p_lat, p_lng,
            p_velocidad, p_direccion, now()
        );
    END IF;

    INSERT INTO public.conductor_ubicacion_actual (
        conductor_id, tenant_id, carrera_id, lat, lng,
        velocidad, direccion, timestamp
    ) VALUES (
        v_tenant, v_tenant, v_carrera, p_lat, p_lng,
        p_velocidad, p_direccion, now()
    )
    ON CONFLICT (conductor_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        carrera_id = EXCLUDED.carrera_id,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        velocidad = EXCLUDED.velocidad,
        direccion = EXCLUDED.direccion,
        timestamp = EXCLUDED.timestamp;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.reportar_ubicacion(double precision, double precision, double precision, double precision, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reportar_ubicacion(double precision, double precision, double precision, double precision, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reportar_ubicacion(double precision, double precision, double precision, double precision, uuid) TO authenticated;

ALTER TABLE public.conductor_ubicacion_actual REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'conductor_ubicacion_actual'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conductor_ubicacion_actual';
    END IF;
END $$;

-- Retencion de historial. pg_cron ya esta instalado en el proyecto.
DO $$
BEGIN
    PERFORM cron.unschedule('drivip_purgar_ubicaciones');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
    'drivip_purgar_ubicaciones',
    '0 4 * * *',
    $$DELETE FROM public.ubicaciones WHERE timestamp < now() - interval '30 days';$$
);
