-- =============================================
-- Migracion: centro de mensajes cliente-conductor
-- Fecha: 2026-10-28
-- Descripcion:
--   Crea conversaciones persistentes por cliente y conductor, sin
--   depender de una carrera activa. Los mensajes del chat de una
--   carrera se sincronizan con la conversacion directa para que el
--   cliente conserve todo su historial en el centro de mensajes.
-- =============================================

CREATE TABLE IF NOT EXISTS public.conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ultima_carrera_id UUID REFERENCES public.carreras(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_conversaciones_cliente_tenant
    ON public.conversaciones(cliente_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente
    ON public.conversaciones(cliente_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversaciones_tenant
    ON public.conversaciones(tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.mensajes_directos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
    emisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emisor_rol TEXT NOT NULL CHECK (emisor_rol IN ('cliente', 'conductor')),
    contenido TEXT NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 1000),
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_directos_conversacion
    ON public.mensajes_directos(conversacion_id, created_at);

CREATE INDEX IF NOT EXISTS idx_mensajes_directos_no_leidos
    ON public.mensajes_directos(conversacion_id, leido)
    WHERE leido = FALSE;

ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_directos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversaciones_select_participantes" ON public.conversaciones;
CREATE POLICY "conversaciones_select_participantes"
ON public.conversaciones FOR SELECT
TO authenticated
USING (
    cliente_id = auth.uid()
    OR tenant_id = public.tenant_id()
);

DROP POLICY IF EXISTS "mensajes_directos_select_participantes" ON public.mensajes_directos;
CREATE POLICY "mensajes_directos_select_participantes"
ON public.mensajes_directos FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversaciones c
        WHERE c.id = mensajes_directos.conversacion_id
          AND (c.cliente_id = auth.uid() OR c.tenant_id = public.tenant_id())
    )
);

DROP POLICY IF EXISTS "mensajes_directos_insert_participantes" ON public.mensajes_directos;
CREATE POLICY "mensajes_directos_insert_participantes"
ON public.mensajes_directos FOR INSERT
TO authenticated
WITH CHECK (
    emisor_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.conversaciones c
        WHERE c.id = mensajes_directos.conversacion_id
          AND (
              (mensajes_directos.emisor_rol = 'cliente' AND c.cliente_id = auth.uid())
              OR
              (mensajes_directos.emisor_rol = 'conductor' AND c.tenant_id = public.tenant_id())
          )
    )
);

GRANT SELECT ON public.conversaciones TO authenticated;
GRANT SELECT, INSERT ON public.mensajes_directos TO authenticated;

-- El cliente abre o recupera la conversacion con un conductor de su red.
CREATE OR REPLACE FUNCTION public.obtener_o_crear_conversacion(
    p_tenant_id UUID,
    p_carrera_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_carrera UUID;
    v_conversacion UUID;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.red_cliente rc
        WHERE rc.cliente_id = v_user
          AND rc.conductor_tenant_id = p_tenant_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.carreras c
        WHERE c.cliente_id = v_user
          AND c.tenant_id = p_tenant_id
    ) THEN
        RAISE EXCEPTION 'conductor_no_en_red';
    END IF;

    IF p_carrera_id IS NOT NULL THEN
        SELECT c.id INTO v_carrera
        FROM public.carreras c
        WHERE c.id = p_carrera_id
          AND c.cliente_id = v_user
          AND c.tenant_id = p_tenant_id;
    END IF;

    IF v_carrera IS NULL THEN
        SELECT c.id INTO v_carrera
        FROM public.carreras c
        WHERE c.cliente_id = v_user
          AND c.tenant_id = p_tenant_id
        ORDER BY c.created_at DESC
        LIMIT 1;
    END IF;

    INSERT INTO public.conversaciones (cliente_id, tenant_id, ultima_carrera_id)
    VALUES (v_user, p_tenant_id, v_carrera)
    ON CONFLICT (cliente_id, tenant_id) DO UPDATE
    SET ultima_carrera_id = COALESCE(EXCLUDED.ultima_carrera_id, ultima_carrera_id),
        updated_at = NOW()
    RETURNING id INTO v_conversacion;

    RETURN v_conversacion;
END;
$$;

-- El chat de una carrera resuelve la conversacion de sus participantes.
CREATE OR REPLACE FUNCTION public.obtener_conversacion_carrera(p_carrera_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_cliente UUID;
    v_tenant UUID;
    v_conversacion UUID;
BEGIN
    SELECT c.cliente_id, c.tenant_id
    INTO v_cliente, v_tenant
    FROM public.carreras c
    WHERE c.id = p_carrera_id;

    IF v_cliente IS NULL OR v_tenant IS NULL THEN
        RAISE EXCEPTION 'carrera_sin_participantes';
    END IF;

    IF v_user IS NULL OR (v_cliente <> v_user AND v_tenant <> public.tenant_id()) THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    INSERT INTO public.conversaciones (cliente_id, tenant_id, ultima_carrera_id)
    VALUES (v_cliente, v_tenant, p_carrera_id)
    ON CONFLICT (cliente_id, tenant_id) DO UPDATE
    SET ultima_carrera_id = EXCLUDED.ultima_carrera_id,
        updated_at = NOW()
    RETURNING id INTO v_conversacion;

    RETURN v_conversacion;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_conversaciones_cliente()
RETURNS TABLE (
    conversacion_id UUID,
    tenant_id UUID,
    ultima_carrera_id UUID,
    ultimo_mensaje TEXT,
    ultimo_mensaje_at TIMESTAMPTZ,
    ultimo_emisor_id UUID,
    ultimo_emisor_rol TEXT,
    no_leidos INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.id,
        c.tenant_id,
        c.ultima_carrera_id,
        lm.contenido,
        lm.created_at,
        lm.emisor_id,
        lm.emisor_rol,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.mensajes_directos m
            WHERE m.conversacion_id = c.id
              AND m.emisor_id <> auth.uid()
              AND m.leido = FALSE
        ), 0)
    FROM public.conversaciones c
    LEFT JOIN LATERAL (
        SELECT m.contenido, m.created_at, m.emisor_id, m.emisor_rol
        FROM public.mensajes_directos m
        WHERE m.conversacion_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) lm ON TRUE
    WHERE c.cliente_id = auth.uid()
    ORDER BY COALESCE(lm.created_at, c.updated_at) DESC;
$$;

CREATE OR REPLACE FUNCTION public.marcar_mensajes_directos_leidos(p_conversacion_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_ids UUID[];
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.conversaciones c
        WHERE c.id = p_conversacion_id
          AND (c.cliente_id = v_user OR c.tenant_id = public.tenant_id())
    ) THEN
        RETURN 0;
    END IF;

    SELECT ARRAY_AGG(m.id) INTO v_ids
    FROM public.mensajes_directos m
    WHERE m.conversacion_id = p_conversacion_id
      AND m.emisor_id <> v_user
      AND m.leido = FALSE;

    IF v_ids IS NULL THEN
        RETURN 0;
    END IF;

    UPDATE public.mensajes_directos
    SET leido = TRUE
    WHERE id = ANY(v_ids);

    UPDATE public.mensajes_carrera
    SET leido = TRUE
    WHERE id = ANY(v_ids);

    RETURN ARRAY_LENGTH(v_ids, 1);
END;
$$;

-- Mantiene el conteo de no leidos sincronizado cuando se usa el chat de carrera.
CREATE OR REPLACE FUNCTION public.marcar_mensajes_leidos(p_carrera_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_ids UUID[];
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.carreras c
        WHERE c.id = p_carrera_id
          AND (c.cliente_id = v_user OR c.tenant_id = public.tenant_id())
    ) THEN
        RETURN 0;
    END IF;

    SELECT ARRAY_AGG(m.id) INTO v_ids
    FROM public.mensajes_carrera m
    WHERE m.carrera_id = p_carrera_id
      AND m.emisor_id <> v_user
      AND m.leido = FALSE;

    IF v_ids IS NULL THEN
        RETURN 0;
    END IF;

    UPDATE public.mensajes_carrera
    SET leido = TRUE
    WHERE id = ANY(v_ids);

    UPDATE public.mensajes_directos
    SET leido = TRUE
    WHERE id = ANY(v_ids);

    RETURN ARRAY_LENGTH(v_ids, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_o_crear_conversacion(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obtener_conversacion_carrera(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_conversaciones_cliente() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marcar_mensajes_directos_leidos(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.obtener_o_crear_conversacion(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_conversacion_carrera(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_conversaciones_cliente() TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_mensajes_directos_leidos(UUID) TO authenticated;

-- Historial existente: una conversacion por cliente y conductor.
INSERT INTO public.conversaciones (cliente_id, tenant_id, ultima_carrera_id, created_at, updated_at)
SELECT DISTINCT ON (c.cliente_id, c.tenant_id)
    c.cliente_id,
    c.tenant_id,
    c.id,
    c.created_at,
    c.created_at
FROM public.carreras c
WHERE c.cliente_id IS NOT NULL
ORDER BY c.cliente_id, c.tenant_id, c.created_at DESC
ON CONFLICT (cliente_id, tenant_id) DO NOTHING;

INSERT INTO public.mensajes_directos (
    id, conversacion_id, emisor_id, emisor_rol, contenido, leido, created_at
)
SELECT
    m.id,
    cv.id,
    m.emisor_id,
    m.emisor_rol,
    m.contenido,
    m.leido,
    m.created_at
FROM public.mensajes_carrera m
JOIN public.carreras c ON c.id = m.carrera_id
JOIN public.conversaciones cv
  ON cv.cliente_id = c.cliente_id
 AND cv.tenant_id = c.tenant_id
WHERE c.cliente_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_conversacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.conversaciones
    SET updated_at = GREATEST(updated_at, NEW.created_at)
    WHERE id = NEW.conversacion_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_mensaje_carrera_a_directo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente UUID;
    v_tenant UUID;
    v_conversacion UUID;
BEGIN
    SELECT c.cliente_id, c.tenant_id
    INTO v_cliente, v_tenant
    FROM public.carreras c
    WHERE c.id = NEW.carrera_id;

    IF v_cliente IS NULL OR v_tenant IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.conversaciones (cliente_id, tenant_id, ultima_carrera_id)
    VALUES (v_cliente, v_tenant, NEW.carrera_id)
    ON CONFLICT (cliente_id, tenant_id) DO UPDATE
    SET ultima_carrera_id = EXCLUDED.ultima_carrera_id,
        updated_at = GREATEST(updated_at, NEW.created_at)
    RETURNING id INTO v_conversacion;

    INSERT INTO public.mensajes_directos (
        id, conversacion_id, emisor_id, emisor_rol, contenido, leido, created_at
    ) VALUES (
        NEW.id, v_conversacion, NEW.emisor_id, NEW.emisor_rol,
        NEW.contenido, NEW.leido, NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_mensaje_directo_a_carrera()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_carrera UUID;
BEGIN
    SELECT c.ultima_carrera_id INTO v_carrera
    FROM public.conversaciones c
    WHERE c.id = NEW.conversacion_id;

    IF v_carrera IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.mensajes_carrera (
        id, carrera_id, emisor_id, emisor_rol, contenido, leido, created_at
    ) VALUES (
        NEW.id, v_carrera, NEW.emisor_id, NEW.emisor_rol,
        NEW.contenido, NEW.leido, NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mensajes_directos_touch ON public.mensajes_directos;
CREATE TRIGGER trg_mensajes_directos_touch
    AFTER INSERT ON public.mensajes_directos
    FOR EACH ROW EXECUTE FUNCTION public.touch_conversacion();

DROP TRIGGER IF EXISTS trg_mensajes_directos_a_carrera ON public.mensajes_directos;
CREATE TRIGGER trg_mensajes_directos_a_carrera
    AFTER INSERT ON public.mensajes_directos
    FOR EACH ROW EXECUTE FUNCTION public.sync_mensaje_directo_a_carrera();

DROP TRIGGER IF EXISTS trg_mensajes_carrera_a_directo ON public.mensajes_carrera;
CREATE TRIGGER trg_mensajes_carrera_a_directo
    AFTER INSERT ON public.mensajes_carrera
    FOR EACH ROW EXECUTE FUNCTION public.sync_mensaje_carrera_a_directo();

ALTER TABLE public.conversaciones REPLICA IDENTITY FULL;
ALTER TABLE public.mensajes_directos REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'conversaciones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversaciones;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'mensajes_directos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_directos;
    END IF;
END $$;
