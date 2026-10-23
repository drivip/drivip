-- =============================================
-- Centro de comunicacion Superadmin <-> Conductor
-- Fecha: 2026-11-12
-- Descripcion:
--   Canal persistente de mensajes entre el equipo Drivip (superadmin)
--   y cada conductor (tenant). Incluye avisos automaticos de estado de
--   suscripcion y notificaciones manuales en ambos sentidos.
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    emisor_rol TEXT NOT NULL CHECK (emisor_rol IN ('superadmin', 'conductor', 'sistema')),
    emisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    titulo TEXT,
    contenido TEXT NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 2000),
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_mensajes_tenant
    ON public.admin_mensajes(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_mensajes_no_leidos
    ON public.admin_mensajes(tenant_id, leido)
    WHERE leido = FALSE;

ALTER TABLE public.admin_mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_mensajes_select" ON public.admin_mensajes;
CREATE POLICY "admin_mensajes_select"
ON public.admin_mensajes FOR SELECT
TO authenticated
USING (
    public.is_superadmin() = TRUE
    OR tenant_id = public.tenant_id()
);

GRANT SELECT ON public.admin_mensajes TO authenticated;

-- =============================================
-- RPC: enviar mensaje en el canal admin <-> conductor
-- =============================================
CREATE OR REPLACE FUNCTION public.enviar_mensaje_admin(
    p_tenant_id UUID,
    p_titulo TEXT,
    p_contenido TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_rol TEXT;
    v_tenant UUID;
    v_texto TEXT := NULLIF(btrim(COALESCE(p_contenido, '')), '');
    v_titulo TEXT := NULLIF(btrim(COALESCE(p_titulo, '')), '');
    v_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF v_texto IS NULL THEN
        RAISE EXCEPTION 'mensaje_vacio';
    END IF;

    IF public.is_superadmin() THEN
        v_rol := 'superadmin';
        v_tenant := p_tenant_id;
        IF v_tenant IS NULL THEN
            RAISE EXCEPTION 'tenant_requerido';
        END IF;
    ELSE
        v_rol := 'conductor';
        v_tenant := public.tenant_id();
        IF v_tenant IS NULL OR p_tenant_id IS NULL OR v_tenant <> p_tenant_id THEN
            RAISE EXCEPTION 'no_autorizado';
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tenant) THEN
        RAISE EXCEPTION 'tenant_no_encontrado';
    END IF;

    INSERT INTO public.admin_mensajes (
        tenant_id, emisor_rol, emisor_id, titulo, contenido
    ) VALUES (
        v_tenant, v_rol, v_user, v_titulo, left(v_texto, 2000)
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- =============================================
-- RPC: listar mensajes del canal de un tenant
-- =============================================
CREATE OR REPLACE FUNCTION public.listar_mensajes_admin(
    p_tenant_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    emisor_rol TEXT,
    emisor_id UUID,
    titulo TEXT,
    contenido TEXT,
    leido BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_tenant UUID;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF public.is_superadmin() THEN
        v_tenant := p_tenant_id;
        IF v_tenant IS NULL THEN
            RAISE EXCEPTION 'tenant_requerido';
        END IF;
    ELSE
        v_tenant := public.tenant_id();
        IF v_tenant IS NULL OR p_tenant_id IS NULL OR v_tenant <> p_tenant_id THEN
            RAISE EXCEPTION 'no_autorizado';
        END IF;
    END IF;

    RETURN QUERY
    SELECT *
    FROM (
        SELECT
            m.id,
            m.tenant_id,
            m.emisor_rol,
            m.emisor_id,
            m.titulo,
            m.contenido,
            m.leido,
            m.created_at
        FROM public.admin_mensajes m
        WHERE m.tenant_id = v_tenant
        ORDER BY m.created_at DESC
        LIMIT GREATEST(COALESCE(p_limit, 100), 1)
    ) recientes
    ORDER BY recientes.created_at ASC;
END;
$$;

-- =============================================
-- RPC: bandeja del superadmin con ultimo mensaje y no leidos
-- =============================================
CREATE OR REPLACE FUNCTION public.listar_conversaciones_admin()
RETURNS TABLE (
    tenant_id UUID,
    tenant_nombre TEXT,
    tenant_slug TEXT,
    tenant_email TEXT,
    ultimo_mensaje TEXT,
    ultimo_mensaje_at TIMESTAMPTZ,
    ultimo_emisor_rol TEXT,
    no_leidos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    RETURN QUERY
    SELECT
        t.id,
        t.nombre,
        t.slug,
        t.email,
        lm.contenido,
        lm.created_at,
        lm.emisor_rol,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM public.admin_mensajes m
            WHERE m.tenant_id = t.id
              AND m.emisor_rol = 'conductor'
              AND m.leido = FALSE
        ), 0)
    FROM public.tenants t
    LEFT JOIN LATERAL (
        SELECT m.contenido, m.created_at, m.emisor_rol
        FROM public.admin_mensajes m
        WHERE m.tenant_id = t.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) lm ON TRUE
    ORDER BY COALESCE(lm.created_at, t.created_at) DESC, t.nombre ASC;
END;
$$;

-- =============================================
-- RPC: marcar mensajes recibidos como leidos
-- =============================================
CREATE OR REPLACE FUNCTION public.marcar_mensajes_admin_leidos(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_tenant UUID;
    v_count INTEGER := 0;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF public.is_superadmin() THEN
        v_tenant := p_tenant_id;
        IF v_tenant IS NULL THEN
            RAISE EXCEPTION 'tenant_requerido';
        END IF;
    ELSE
        v_tenant := public.tenant_id();
        IF v_tenant IS NULL OR p_tenant_id IS NULL OR v_tenant <> p_tenant_id THEN
            RAISE EXCEPTION 'no_autorizado';
        END IF;
    END IF;

    UPDATE public.admin_mensajes
    SET leido = TRUE
    WHERE tenant_id = v_tenant
      AND leido = FALSE
      AND (emisor_id IS DISTINCT FROM v_user);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- =============================================
-- Avisos automaticos de suscripcion
-- =============================================
CREATE OR REPLACE FUNCTION public.generar_avisos_suscripcion()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_count INTEGER := 0;
    v_vencimiento TEXT;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('drivip_avisos_suscripcion'));

    FOR v_tenant IN
        SELECT t.id, t.nombre, t.suscripcion_activa, t.fecha_vencimiento
        FROM public.tenants t
    LOOP
        IF v_tenant.suscripcion_activa IS TRUE
           AND NOT EXISTS (
               SELECT 1 FROM public.admin_mensajes m
               WHERE m.tenant_id = v_tenant.id
                 AND m.emisor_rol = 'sistema'
                 AND m.titulo = 'Servicio activo'
           )
        THEN
            v_vencimiento := CASE
                WHEN v_tenant.fecha_vencimiento IS NULL THEN NULL
                ELSE to_char(v_tenant.fecha_vencimiento AT TIME ZONE 'America/Caracas', 'DD/MM/YYYY')
            END;

            INSERT INTO public.admin_mensajes (
                tenant_id, emisor_rol, emisor_id, titulo, contenido
            ) VALUES (
                v_tenant.id,
                'sistema',
                NULL,
                'Servicio activo',
                CASE
                    WHEN v_vencimiento IS NULL THEN
                        'Tu servicio Drivip está activo. Puedes recibir solicitudes de tus clientes.'
                    ELSE
                        format(
                            'Tu servicio Drivip está activo hasta el %s. Gracias por seguir con nosotros.',
                            v_vencimiento
                        )
                END
            );
            v_count := v_count + 1;
        END IF;

        IF v_tenant.suscripcion_activa IS TRUE
           AND v_tenant.fecha_vencimiento IS NOT NULL
           AND v_tenant.fecha_vencimiento >= NOW() - INTERVAL '1 day'
           AND v_tenant.fecha_vencimiento <= NOW() + INTERVAL '7 days'
           AND NOT EXISTS (
               SELECT 1 FROM public.admin_mensajes m
               WHERE m.tenant_id = v_tenant.id
                 AND m.emisor_rol = 'sistema'
                 AND m.titulo = 'Tu suscripción está por vencer'
                 AND m.created_at > NOW() - INTERVAL '20 hours'
           )
        THEN
            v_vencimiento := to_char(
                v_tenant.fecha_vencimiento AT TIME ZONE 'America/Caracas',
                'DD/MM/YYYY'
            );

            INSERT INTO public.admin_mensajes (
                tenant_id, emisor_rol, emisor_id, titulo, contenido
            ) VALUES (
                v_tenant.id,
                'sistema',
                NULL,
                'Tu suscripción está por vencer',
                format(
                    'Tu suscripción vence el %s. Por favor renueva para seguir disfrutando del servicio Drivip.',
                    v_vencimiento
                )
            );
            v_count := v_count + 1;
        END IF;

        IF v_tenant.suscripcion_activa IS NOT TRUE
           AND v_tenant.fecha_vencimiento IS NOT NULL
           AND v_tenant.fecha_vencimiento < NOW()
           AND NOT EXISTS (
               SELECT 1 FROM public.admin_mensajes m
               WHERE m.tenant_id = v_tenant.id
                 AND m.emisor_rol = 'sistema'
                 AND m.titulo = 'Servicio inactivo'
                 AND m.created_at > NOW() - INTERVAL '20 hours'
           )
        THEN
            INSERT INTO public.admin_mensajes (
                tenant_id, emisor_rol, emisor_id, titulo, contenido
            ) VALUES (
                v_tenant.id,
                'sistema',
                NULL,
                'Servicio inactivo',
                'Tu suscripción venció. Renueva para volver a recibir solicitudes de servicio.'
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$;

-- Avisos inmediatos cuando cambia el estado de la suscripcion del tenant.
CREATE OR REPLACE FUNCTION public.avisar_cambio_suscripcion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vencimiento TEXT;
BEGIN
    v_vencimiento := CASE
        WHEN NEW.fecha_vencimiento IS NULL THEN NULL
        ELSE to_char(NEW.fecha_vencimiento AT TIME ZONE 'America/Caracas', 'DD/MM/YYYY')
    END;

    IF TG_OP = 'INSERT' THEN
        IF NEW.suscripcion_activa IS TRUE THEN
            INSERT INTO public.admin_mensajes (
                tenant_id, emisor_rol, emisor_id, titulo, contenido
            ) VALUES (
                NEW.id,
                'sistema',
                NULL,
                'Servicio activo',
                CASE
                    WHEN v_vencimiento IS NULL THEN
                        'Tu servicio Drivip está activo. Puedes recibir solicitudes de tus clientes.'
                    ELSE
                        format('Tu servicio Drivip está activo hasta el %s.', v_vencimiento)
                END
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.suscripcion_activa IS TRUE
           AND (
               OLD.suscripcion_activa IS NOT TRUE
               OR NEW.fecha_vencimiento IS DISTINCT FROM OLD.fecha_vencimiento
           )
        THEN
            INSERT INTO public.admin_mensajes (
                tenant_id, emisor_rol, emisor_id, titulo, contenido
            ) VALUES (
                NEW.id,
                'sistema',
                NULL,
                'Servicio activo',
                CASE
                    WHEN v_vencimiento IS NULL THEN
                        'Tu servicio Drivip está activo. Puedes recibir solicitudes de tus clientes.'
                    ELSE
                        format('Tu servicio Drivip está activo hasta el %s.', v_vencimiento)
                END
            );
        END IF;

        IF OLD.suscripcion_activa IS TRUE AND NEW.suscripcion_activa IS NOT TRUE THEN
            INSERT INTO public.admin_mensajes (
                tenant_id, emisor_rol, emisor_id, titulo, contenido
            ) VALUES (
                NEW.id,
                'sistema',
                NULL,
                'Servicio inactivo',
                'Tu cuenta fue desactivada. Contacta a Drivip para reactivar tu servicio.'
            );
        END IF;
    END IF;

    IF NEW.suscripcion_activa IS TRUE
       AND NEW.fecha_vencimiento IS NOT NULL
       AND NEW.fecha_vencimiento >= NOW() - INTERVAL '1 day'
       AND NEW.fecha_vencimiento <= NOW() + INTERVAL '7 days'
       AND NOT EXISTS (
           SELECT 1 FROM public.admin_mensajes m
           WHERE m.tenant_id = NEW.id
             AND m.emisor_rol = 'sistema'
             AND m.titulo = 'Tu suscripción está por vencer'
             AND m.created_at > NOW() - INTERVAL '20 hours'
       )
    THEN
        INSERT INTO public.admin_mensajes (
            tenant_id, emisor_rol, emisor_id, titulo, contenido
        ) VALUES (
            NEW.id,
            'sistema',
            NULL,
            'Tu suscripción está por vencer',
            format(
                'Tu suscripción vence el %s. Por favor renueva para seguir disfrutando del servicio Drivip.',
                v_vencimiento
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_aviso_suscripcion ON public.tenants;
CREATE TRIGGER trg_tenants_aviso_suscripcion
    AFTER INSERT OR UPDATE OF suscripcion_activa, fecha_vencimiento
    ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.avisar_cambio_suscripcion();

-- Realtime para que el aviso flotante y el centro se actualicen en vivo.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'admin_mensajes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_mensajes;
    END IF;
END $$;

ALTER TABLE public.admin_mensajes REPLICA IDENTITY FULL;

REVOKE ALL ON FUNCTION public.enviar_mensaje_admin(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_mensajes_admin(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_conversaciones_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marcar_mensajes_admin_leidos(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generar_avisos_suscripcion() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.enviar_mensaje_admin(UUID, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.listar_mensajes_admin(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.listar_conversaciones_admin() FROM anon;
REVOKE ALL ON FUNCTION public.marcar_mensajes_admin_leidos(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.generar_avisos_suscripcion() FROM anon;
REVOKE ALL ON FUNCTION public.avisar_cambio_suscripcion() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enviar_mensaje_admin(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_mensajes_admin(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_conversaciones_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_mensajes_admin_leidos(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generar_avisos_suscripcion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generar_avisos_suscripcion() TO service_role;

-- Avisos diarios automaticos (si pg_cron esta disponible).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drivip_avisos_suscripcion') THEN
            PERFORM cron.unschedule('drivip_avisos_suscripcion');
        END IF;

        PERFORM cron.schedule(
            'drivip_avisos_suscripcion',
            '0 13 * * *',
            'SELECT public.generar_avisos_suscripcion();'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

NOTIFY pgrst, 'reload schema';
