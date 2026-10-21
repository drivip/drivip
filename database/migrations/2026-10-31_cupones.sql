-- =============================================
-- Cupones del conductor y canje desde el cliente
-- Fecha: 2026-10-31
-- Descripcion:
--   1. Cupones creados por cada conductor (tenant).
--   2. Envios de cupones a clientes (grupales o individuales).
--   3. Listado de cupones disponibles para el cliente.
--   4. Canje seguro de un cupon por parte del cliente.
-- =============================================

CREATE TABLE IF NOT EXISTS public.cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT public.tenant_id()
        REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'monto')),
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    valido_hasta TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cupones_codigo_formato CHECK (codigo ~ '^[A-Z0-9_-]{3,32}$'),
    CONSTRAINT cupones_porcentaje_max CHECK (tipo <> 'porcentaje' OR valor <= 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cupones_tenant_codigo
    ON public.cupones(tenant_id, codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_tenant_activo
    ON public.cupones(tenant_id, activo, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cupon_envios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupon_id UUID NOT NULL REFERENCES public.cupones(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL DEFAULT public.tenant_id()
        REFERENCES public.tenants(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'usado', 'vencido')),
    enviado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usado_at TIMESTAMPTZ,
    carrera_id UUID REFERENCES public.carreras(id) ON DELETE SET NULL,
    UNIQUE (cupon_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_cupon_envios_cliente
    ON public.cupon_envios(cliente_id, estado, enviado_at DESC);
CREATE INDEX IF NOT EXISTS idx_cupon_envios_tenant
    ON public.cupon_envios(tenant_id, estado, enviado_at DESC);

ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupon_envios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cupones_select" ON public.cupones;
CREATE POLICY "cupones_select"
ON public.cupones FOR SELECT
TO authenticated
USING (
    tenant_id = public.tenant_id()
    OR EXISTS (
        SELECT 1 FROM public.cupon_envios e
        WHERE e.cupon_id = cupones.id
          AND e.cliente_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "cupones_insert" ON public.cupones;
CREATE POLICY "cupones_insert"
ON public.cupones FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS "cupones_update" ON public.cupones;
CREATE POLICY "cupones_update"
ON public.cupones FOR UPDATE
TO authenticated
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS "cupones_delete" ON public.cupones;
CREATE POLICY "cupones_delete"
ON public.cupones FOR DELETE
TO authenticated
USING (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS "cupon_envios_select" ON public.cupon_envios;
CREATE POLICY "cupon_envios_select"
ON public.cupon_envios FOR SELECT
TO authenticated
USING (
    tenant_id = public.tenant_id()
    OR cliente_id = auth.uid()
);

DROP POLICY IF EXISTS "cupon_envios_insert" ON public.cupon_envios;
CREATE POLICY "cupon_envios_insert"
ON public.cupon_envios FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS "cupon_envios_update" ON public.cupon_envios;
CREATE POLICY "cupon_envios_update"
ON public.cupon_envios FOR UPDATE
TO authenticated
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupon_envios TO authenticated;

-- Cupones del conductor con contadores de envios y canjes.
CREATE OR REPLACE FUNCTION public.listar_cupones_conductor()
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    codigo TEXT,
    tipo TEXT,
    valor NUMERIC,
    activo BOOLEAN,
    valido_hasta TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    envios INTEGER,
    canjeados INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.id,
        c.tenant_id,
        c.codigo,
        c.tipo,
        c.valor,
        c.activo,
        c.valido_hasta,
        c.created_at,
        COUNT(e.id)::INTEGER AS envios,
        COUNT(e.id) FILTER (WHERE e.estado = 'usado')::INTEGER AS canjeados
    FROM public.cupones c
    LEFT JOIN public.cupon_envios e ON e.cupon_id = c.id
    WHERE c.tenant_id = public.tenant_id()
    GROUP BY c.id
    ORDER BY c.created_at DESC;
$$;

-- Envia un cupon a uno o varios clientes del conductor.
CREATE OR REPLACE FUNCTION public.enviar_cupon(
    p_cupon_id UUID,
    p_cliente_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant UUID := public.tenant_id();
    v_count INTEGER := 0;
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.cupones c
        WHERE c.id = p_cupon_id
          AND c.tenant_id = v_tenant
    ) THEN
        RAISE EXCEPTION 'cupon_no_encontrado';
    END IF;

    INSERT INTO public.cupon_envios (cupon_id, tenant_id, cliente_id)
    SELECT p_cupon_id, v_tenant, x.cliente_id
    FROM unnest(COALESCE(p_cliente_ids, ARRAY[]::UUID[])) AS x(cliente_id)
    WHERE x.cliente_id IS NOT NULL
      AND (
          EXISTS (
              SELECT 1 FROM public.clientes cl
              WHERE cl.tenant_id = v_tenant
                AND (cl.profile_id = x.cliente_id OR cl.id = x.cliente_id)
          )
          OR EXISTS (
              SELECT 1 FROM public.carreras ca
              WHERE ca.tenant_id = v_tenant
                AND ca.cliente_id = x.cliente_id
          )
      )
    ON CONFLICT (cupon_id, cliente_id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE public.cupones
    SET updated_at = NOW()
    WHERE id = p_cupon_id;

    RETURN v_count;
END;
$$;

-- Cupones que el cliente puede ver y canjear.
CREATE OR REPLACE FUNCTION public.listar_cupones_cliente()
RETURNS TABLE (
    envio_id UUID,
    cupon_id UUID,
    codigo TEXT,
    tipo TEXT,
    valor NUMERIC,
    valido_hasta TIMESTAMPTZ,
    estado TEXT,
    enviado_at TIMESTAMPTZ,
    usado_at TIMESTAMPTZ,
    conductor_tenant_id UUID,
    conductor_nombre TEXT,
    conductor_slug TEXT,
    conductor_logo_url TEXT,
    conductor_telefono TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        e.id,
        c.id,
        c.codigo,
        c.tipo,
        c.valor,
        c.valido_hasta,
        e.estado,
        e.enviado_at,
        e.usado_at,
        c.tenant_id,
        t.nombre,
        t.slug,
        t.logo_url,
        t.telefono
    FROM public.cupon_envios e
    JOIN public.cupones c ON c.id = e.cupon_id
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE e.cliente_id = auth.uid()
      AND (
          e.estado <> 'disponible'
          OR (
              c.activo
              AND (c.valido_hasta IS NULL OR c.valido_hasta > NOW())
          )
      )
    ORDER BY
        CASE WHEN e.estado = 'disponible' THEN 0 ELSE 1 END,
        e.enviado_at DESC;
$$;

-- Canje seguro del cupon por parte del cliente.
CREATE OR REPLACE FUNCTION public.canjear_cupon(p_cupon_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_envio public.cupon_envios%ROWTYPE;
    v_cupon public.cupones%ROWTYPE;
    v_conductor TEXT;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    SELECT e.* INTO v_envio
    FROM public.cupon_envios e
    WHERE e.cupon_id = p_cupon_id
      AND e.cliente_id = v_user
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_no_disponible');
    END IF;

    SELECT c.* INTO v_cupon
    FROM public.cupones c
    WHERE c.id = p_cupon_id;

    IF NOT FOUND OR NOT v_cupon.activo THEN
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_inactivo');
    END IF;

    IF v_envio.estado = 'usado' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_ya_usado');
    END IF;

    IF v_envio.estado = 'vencido'
       OR (v_cupon.valido_hasta IS NOT NULL AND v_cupon.valido_hasta <= NOW()) THEN
        UPDATE public.cupon_envios
        SET estado = 'vencido'
        WHERE id = v_envio.id;
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_vencido');
    END IF;

    UPDATE public.cupon_envios
    SET estado = 'usado',
        usado_at = NOW()
    WHERE id = v_envio.id;

    SELECT nombre INTO v_conductor
    FROM public.tenants
    WHERE id = v_cupon.tenant_id;

    RETURN jsonb_build_object(
        'ok', true,
        'codigo', v_cupon.codigo,
        'tipo', v_cupon.tipo,
        'valor', v_cupon.valor,
        'conductor', v_conductor,
        'usado_at', NOW()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.listar_cupones_conductor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enviar_cupon(UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_cupones_cliente() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.canjear_cupon(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.listar_cupones_conductor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enviar_cupon(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_cupones_cliente() TO authenticated;
GRANT EXECUTE ON FUNCTION public.canjear_cupon(UUID) TO authenticated;

-- Realtime para que el cliente vea el cupon apenas el conductor lo envia.
ALTER TABLE public.cupones REPLICA IDENTITY FULL;
ALTER TABLE public.cupon_envios REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'cupones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cupones;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'cupon_envios'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cupon_envios;
    END IF;
END $$;
