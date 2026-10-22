-- =============================================
-- Fix: column reference "updated_at" is ambiguous
-- Fecha: 2026-11-03
-- Descripcion:
--   Al enviar mensajes entre cliente y conductor, los triggers
--   sincronizan la conversacion directa y el chat de la carrera.
--   En el ON CONFLICT DO UPDATE se referenciaba updated_at sin
--   calificar, por lo que Postgres no sabia si era la columna de
--   conversaciones o la de EXCLUDED. Se califican las columnas.
-- =============================================

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
    SET ultima_carrera_id = COALESCE(EXCLUDED.ultima_carrera_id, conversaciones.ultima_carrera_id),
        updated_at = NOW()
    RETURNING id INTO v_conversacion;

    RETURN v_conversacion;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_conversacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.conversaciones AS c
    SET updated_at = GREATEST(c.updated_at, NEW.created_at)
    WHERE c.id = NEW.conversacion_id;
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
        updated_at = GREATEST(conversaciones.updated_at, NEW.created_at)
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
