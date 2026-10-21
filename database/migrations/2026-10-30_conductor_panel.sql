-- =============================================
-- Panel del conductor: disponibilidad, mensajes y banners
-- Fecha: 2026-10-30
-- Descripcion:
--   1. Estado de disponibilidad persistente del conductor.
--   2. Conversaciones del conductor con datos del cliente.
--   3. Banners editables: imagen, enlace, CTA y orden.
--   4. get_conductores_red expone la disponibilidad al cliente.
-- =============================================

-- 1. Disponibilidad del conductor -------------------------------------------
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS disponibilidad TEXT NOT NULL DEFAULT 'disponible';
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS disponibilidad_nota TEXT;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS disponibilidad_hasta TIMESTAMPTZ;

ALTER TABLE public.tenants
    DROP CONSTRAINT IF EXISTS tenants_disponibilidad_check;
ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_disponibilidad_check
    CHECK (disponibilidad IN ('disponible', 'ocupado', 'pausa_30', 'personalizado'));

CREATE OR REPLACE FUNCTION public.actualizar_disponibilidad_conductor(
    p_estado TEXT,
    p_nota TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant UUID := public.tenant_id();
    v_nota TEXT := NULLIF(trim(COALESCE(p_nota, '')), '');
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    IF p_estado NOT IN ('disponible', 'ocupado', 'pausa_30', 'personalizado') THEN
        RAISE EXCEPTION 'estado_invalido';
    END IF;

    UPDATE public.tenants
    SET disponibilidad = p_estado,
        disponibilidad_nota = CASE
            WHEN p_estado = 'personalizado' THEN COALESCE(v_nota, 'No disponible')
            WHEN p_estado = 'pausa_30' THEN COALESCE(v_nota, 'Se desocupa en 30 min')
            ELSE NULL
        END,
        disponibilidad_hasta = CASE
            WHEN p_estado = 'pausa_30' THEN NOW() + INTERVAL '30 minutes'
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = v_tenant;

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_disponibilidad_conductor(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_disponibilidad_conductor(TEXT, TEXT) TO authenticated;

-- 2. Banners editables -------------------------------------------------------
ALTER TABLE public.tenant_banners
    ADD COLUMN IF NOT EXISTS enlace_url TEXT;
ALTER TABLE public.tenant_banners
    ADD COLUMN IF NOT EXISTS cta_texto TEXT;
ALTER TABLE public.tenant_banners
    ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tenant_banners_orden
    ON public.tenant_banners(tenant_id, activo, orden, prioridad);

-- 3. Conversaciones del conductor -------------------------------------------
CREATE OR REPLACE FUNCTION public.listar_conversaciones_conductor()
RETURNS TABLE (
    conversacion_id UUID,
    cliente_id UUID,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    ultima_carrera_id UUID,
    ultimo_mensaje TEXT,
    ultimo_mensaje_at TIMESTAMPTZ,
    ultimo_emisor_id UUID,
    ultimo_emisor_rol TEXT,
    no_leidos INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        cv.id,
        cv.cliente_id,
        COALESCE(
            NULLIF(trim(concat_ws(' ', p.nombre, p.apellido)), ''),
            NULLIF(trim(cl.nombre), ''),
            'Cliente'
        ) AS cliente_nombre,
        COALESCE(p.telefono, cl.telefono) AS cliente_telefono,
        cv.ultima_carrera_id,
        lm.contenido,
        lm.created_at,
        lm.emisor_id,
        lm.emisor_rol,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.mensajes_directos m
            WHERE m.conversacion_id = cv.id
              AND m.emisor_id <> auth.uid()
              AND m.leido = FALSE
        ), 0) AS no_leidos
    FROM public.conversaciones cv
    LEFT JOIN public.profiles p ON p.id = cv.cliente_id
    LEFT JOIN LATERAL (
        SELECT cli.nombre, cli.telefono
        FROM public.clientes cli
        WHERE cli.profile_id = cv.cliente_id
          AND cli.tenant_id = cv.tenant_id
        LIMIT 1
    ) cl ON TRUE
    LEFT JOIN LATERAL (
        SELECT m.contenido, m.created_at, m.emisor_id, m.emisor_rol
        FROM public.mensajes_directos m
        WHERE m.conversacion_id = cv.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) lm ON TRUE
    WHERE cv.tenant_id = public.tenant_id()
    ORDER BY COALESCE(lm.created_at, cv.updated_at) DESC;
$$;

CREATE OR REPLACE FUNCTION public.obtener_o_crear_conversacion_conductor(p_cliente_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant UUID := public.tenant_id();
    v_carrera UUID;
    v_conversacion UUID;
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    SELECT c.id INTO v_carrera
    FROM public.carreras c
    WHERE c.tenant_id = v_tenant
      AND c.cliente_id = p_cliente_id
    ORDER BY c.created_at DESC
    LIMIT 1;

    IF v_carrera IS NULL THEN
        RAISE EXCEPTION 'cliente_sin_servicios';
    END IF;

    INSERT INTO public.conversaciones (cliente_id, tenant_id, ultima_carrera_id)
    VALUES (p_cliente_id, v_tenant, v_carrera)
    ON CONFLICT (cliente_id, tenant_id) DO UPDATE
    SET ultima_carrera_id = COALESCE(EXCLUDED.ultima_carrera_id, conversaciones.ultima_carrera_id),
        updated_at = NOW()
    RETURNING id INTO v_conversacion;

    RETURN v_conversacion;
END;
$$;

REVOKE ALL ON FUNCTION public.listar_conversaciones_conductor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_o_crear_conversacion_conductor(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_conversaciones_conductor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_o_crear_conversacion_conductor(UUID) TO authenticated;

-- 4. Disponibilidad visible para el cliente ---------------------------------
DROP FUNCTION IF EXISTS public.get_conductores_red();

CREATE OR REPLACE FUNCTION public.get_conductores_red()
RETURNS TABLE (
    conductor_tenant_id uuid,
    slug text,
    nombre text,
    logo_url text,
    ciudad text,
    telefono text,
    vehiculo_tipo text,
    vehiculo_placa text,
    vehiculo_modelo text,
    vehiculo_color text,
    calificacion numeric,
    total_resenas bigint,
    pausado boolean,
    suscripcion_activa boolean,
    disponibilidad text,
    disponibilidad_nota text,
    disponibilidad_hasta timestamptz,
    apodo text,
    favorito boolean,
    agregado_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT t.id,
           t.slug,
           t.nombre,
           t.logo_url,
           t.ciudad,
           t.telefono,
           t.vehiculo_tipo,
           t.vehiculo_placa,
           t.vehiculo_modelo,
           t.vehiculo_color,
           t.calificacion,
           (
               SELECT COUNT(*)
               FROM public.carreras c
               WHERE c.tenant_id = t.id
                 AND c.calificacion IS NOT NULL
           ) AS total_resenas,
           t.pausado,
           t.suscripcion_activa,
           t.disponibilidad,
           t.disponibilidad_nota,
           t.disponibilidad_hasta,
           rc.apodo,
           rc.favorito,
           rc.agregado_at
    FROM public.red_cliente rc
    JOIN public.tenants t ON t.id = rc.conductor_tenant_id
    WHERE rc.cliente_id = auth.uid()
    ORDER BY rc.favorito DESC, rc.agregado_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_conductores_red() TO authenticated;

-- 5. Realtime de banners para el panel del conductor -------------------------
ALTER TABLE public.tenant_banners REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'tenant_banners'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_banners;
    END IF;
END $$;
