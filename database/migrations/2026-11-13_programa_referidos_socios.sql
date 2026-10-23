-- =============================================
-- Programa de referidos y socios Drivip
-- =============================================
-- Reglas:
--   * 10% de descuento por cada referido activo (maximo 100%).
--   * Al llegar a 10 referidos activos la mensualidad es gratis.
--   * Desde 10 referidos activos el conductor es socio Drivip y gana
--     5% de la mensualidad de cada referido activo, mes a mes.
--   * Los pagos de comisiones se registran en un ledger auditable.

-- ---------------------------------------------
-- 1. Configuracion del programa
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.config_referidos (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    descuento_por_referido_pct numeric(5, 2) NOT NULL DEFAULT 10
        CHECK (descuento_por_referido_pct >= 0 AND descuento_por_referido_pct <= 100),
    meta_referidos_gratis integer NOT NULL DEFAULT 10
        CHECK (meta_referidos_gratis > 0),
    comision_socio_pct numeric(5, 2) NOT NULL DEFAULT 5
        CHECK (comision_socio_pct >= 0 AND comision_socio_pct <= 100),
    precio_plan_estandar numeric(10, 2) NOT NULL DEFAULT 10,
    precio_plan_profesional numeric(10, 2) NOT NULL DEFAULT 20,
    precio_plan_premium numeric(10, 2) NOT NULL DEFAULT 30,
    actualizado_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.config_referidos (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.config_referidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS config_referidos_select ON public.config_referidos;
CREATE POLICY config_referidos_select ON public.config_referidos
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS config_referidos_update ON public.config_referidos;
CREATE POLICY config_referidos_update ON public.config_referidos
    FOR UPDATE TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- ---------------------------------------------
-- 2. Datos del socio en el tenant
-- ---------------------------------------------
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS socio_drivip boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS socio_desde timestamptz,
    ADD COLUMN IF NOT EXISTS pago_movil_socio_banco text,
    ADD COLUMN IF NOT EXISTS pago_movil_socio_cedula text,
    ADD COLUMN IF NOT EXISTS pago_movil_socio_telefono text,
    ADD COLUMN IF NOT EXISTS pago_movil_socio_actualizado_at timestamptz;

-- ---------------------------------------------
-- 3. Datos de seguimiento del referido
-- ---------------------------------------------
ALTER TABLE public.referidos
    ADD COLUMN IF NOT EXISTS activado_at timestamptz,
    ADD COLUMN IF NOT EXISTS desactivado_at timestamptz,
    ADD COLUMN IF NOT EXISTS plan_referido text,
    ADD COLUMN IF NOT EXISTS monto_mensual_referido numeric(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.referidos DROP CONSTRAINT IF EXISTS referidos_estado_check;
ALTER TABLE public.referidos ADD CONSTRAINT referidos_estado_check
    CHECK (estado IN ('pendiente', 'activo', 'inactivo'));

CREATE INDEX IF NOT EXISTS idx_referidos_estado
    ON public.referidos (referidor_tenant_id, estado);

-- ---------------------------------------------
-- 4. Ledger de comisiones y pagos
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagos_referido (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referidor_tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    monto numeric(10, 2) NOT NULL CHECK (monto > 0),
    metodo text NOT NULL DEFAULT 'pago_movil'
        CHECK (metodo IN ('pago_movil', 'transferencia', 'efectivo', 'otro')),
    referencia text,
    notas text,
    pagado_por text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_referido_referidor
    ON public.pagos_referido (referidor_tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.comisiones_referido (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referidor_tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    referido_tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    periodo text NOT NULL,
    base_monto numeric(10, 2) NOT NULL DEFAULT 0,
    porcentaje numeric(5, 2) NOT NULL DEFAULT 5,
    monto numeric(10, 2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'pagado', 'anulado')),
    pago_id uuid REFERENCES public.pagos_referido(id) ON DELETE SET NULL,
    pagado_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (referido_tenant_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_comisiones_referido_referidor
    ON public.comisiones_referido (referidor_tenant_id, estado, periodo DESC);
CREATE INDEX IF NOT EXISTS idx_comisiones_referido_referido
    ON public.comisiones_referido (referido_tenant_id, periodo DESC);

ALTER TABLE public.pagos_referido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comisiones_referido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pagos_referido_select ON public.pagos_referido;
CREATE POLICY pagos_referido_select ON public.pagos_referido
    FOR SELECT TO authenticated
    USING (referidor_tenant_id = public.tenant_id() OR public.is_superadmin());

DROP POLICY IF EXISTS comisiones_referido_select ON public.comisiones_referido;
CREATE POLICY comisiones_referido_select ON public.comisiones_referido
    FOR SELECT TO authenticated
    USING (referidor_tenant_id = public.tenant_id() OR public.is_superadmin());

-- Escritura solo mediante RPC/triggers (ninguna policy de INSERT/UPDATE).

-- ---------------------------------------------
-- 5. Helpers de calculo
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.precio_plan_referido(p_plan text)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT CASE lower(coalesce(nullif(trim(p_plan), ''), 'estandar'))
        WHEN 'premium' THEN c.precio_plan_premium
        WHEN 'profesional' THEN c.precio_plan_profesional
        ELSE c.precio_plan_estandar
    END
    FROM public.config_referidos c
    WHERE c.id = 1;
$$;

CREATE OR REPLACE FUNCTION public.contar_referidos_activos(p_tenant_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT count(*)::integer
    FROM public.referidos
    WHERE referidor_tenant_id = p_tenant_id
      AND estado = 'activo';
$$;

CREATE OR REPLACE FUNCTION public.calcular_cuenta_referidos(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config public.config_referidos%ROWTYPE;
    v_tenant public.tenants%ROWTYPE;
    v_activos integer;
    v_precio numeric;
    v_pct numeric;
    v_descuento numeric;
    v_total numeric;
    v_pendiente numeric;
    v_pagado numeric;
BEGIN
    IF auth.uid() IS NOT NULL
       AND NOT public.is_superadmin()
       AND p_tenant_id IS DISTINCT FROM public.tenant_id() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    SELECT * INTO v_config FROM public.config_referidos WHERE id = 1;
    SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'tenant_no_encontrado';
    END IF;

    v_activos := public.contar_referidos_activos(p_tenant_id);
    v_precio := public.precio_plan_referido(v_tenant.plan);
    v_pct := least(100, v_activos * v_config.descuento_por_referido_pct);
    v_descuento := round(v_precio * v_pct / 100.0, 2);
    v_total := greatest(0, round(v_precio - v_descuento, 2));

    SELECT COALESCE(sum(monto), 0) INTO v_pendiente
    FROM public.comisiones_referido
    WHERE referidor_tenant_id = p_tenant_id AND estado = 'pendiente';

    SELECT COALESCE(sum(monto), 0) INTO v_pagado
    FROM public.comisiones_referido
    WHERE referidor_tenant_id = p_tenant_id AND estado = 'pagado';

    RETURN jsonb_build_object(
        'tenant_id', p_tenant_id,
        'plan', v_tenant.plan,
        'precio_plan', v_precio,
        'referidos_activos', v_activos,
        'descuento_pct', v_pct,
        'monto_descuento', v_descuento,
        'total_mensual', v_total,
        'es_gratis', v_total = 0 AND v_precio > 0,
        'es_socio', v_tenant.socio_drivip,
        'socio_desde', v_tenant.socio_desde,
        'meta_referidos_gratis', v_config.meta_referidos_gratis,
        'comision_socio_pct', v_config.comision_socio_pct,
        'comisiones_pendientes', v_pendiente,
        'comisiones_pagadas', v_pagado,
        'comisiones_totales', v_pendiente + v_pagado,
        'pago_movil_banco', v_tenant.pago_movil_socio_banco,
        'pago_movil_cedula', v_tenant.pago_movil_socio_cedula,
        'pago_movil_telefono', v_tenant.pago_movil_socio_telefono
    );
END;
$$;

-- ---------------------------------------------
-- 6. Comisiones
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.generar_comision_referido(
    p_referido_tenant_id uuid,
    p_periodo text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ref public.referidos%ROWTYPE;
    v_referidor public.tenants%ROWTYPE;
    v_referido public.tenants%ROWTYPE;
    v_config public.config_referidos%ROWTYPE;
    v_base numeric;
    v_monto numeric;
    v_id uuid;
BEGIN
    SELECT * INTO v_ref
    FROM public.referidos
    WHERE referido_tenant_id = p_referido_tenant_id
      AND estado = 'activo'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_referidor FROM public.tenants WHERE id = v_ref.referidor_tenant_id;
    SELECT * INTO v_referido FROM public.tenants WHERE id = v_ref.referido_tenant_id;
    SELECT * INTO v_config FROM public.config_referidos WHERE id = 1;

    IF NOT FOUND OR NOT COALESCE(v_referidor.socio_drivip, false) THEN
        RETURN NULL;
    END IF;

    v_base := COALESCE(NULLIF(v_ref.monto_mensual_referido, 0), public.precio_plan_referido(v_referido.plan));
    v_monto := round(v_base * v_config.comision_socio_pct / 100.0, 2);

    IF v_monto <= 0 THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.comisiones_referido (
        referidor_tenant_id,
        referido_tenant_id,
        periodo,
        base_monto,
        porcentaje,
        monto
    ) VALUES (
        v_ref.referidor_tenant_id,
        v_ref.referido_tenant_id,
        p_periodo,
        v_base,
        v_config.comision_socio_pct,
        v_monto
    )
    ON CONFLICT (referido_tenant_id, periodo) DO NOTHING
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generar_comisiones_mes_referidos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ref record;
    v_count integer := 0;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    FOR v_ref IN
        SELECT referido_tenant_id
        FROM public.referidos
        WHERE estado = 'activo'
    LOOP
        IF public.generar_comision_referido(v_ref.referido_tenant_id, to_char(now(), 'YYYY-MM')) IS NOT NULL THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.actualizar_estado_socio(p_referidor_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config public.config_referidos%ROWTYPE;
    v_tenant public.tenants%ROWTYPE;
    v_activos integer;
    v_ref record;
BEGIN
    SELECT * INTO v_config FROM public.config_referidos WHERE id = 1;
    SELECT * INTO v_tenant FROM public.tenants WHERE id = p_referidor_tenant_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_activos := public.contar_referidos_activos(p_referidor_tenant_id);

    IF v_activos >= v_config.meta_referidos_gratis AND NOT COALESCE(v_tenant.socio_drivip, false) THEN
        UPDATE public.tenants
        SET socio_drivip = true,
            socio_desde = now(),
            updated_at = now()
        WHERE id = p_referidor_tenant_id;

        INSERT INTO public.tenant_notificaciones (
            tenant_id, titulo, mensaje, tipo, enviada, enviada_at
        ) VALUES (
            p_referidor_tenant_id,
            'Felicitaciones, ya eres socio Drivip',
            'Alcanzaste 10 referidos activos. Tu mensualidad es gratis y desde ahora ganas 5% de la mensualidad de cada referido activo. Registra tu Pago Movil para recibir tus comisiones.',
            'sistema',
            true,
            now()
        );

        FOR v_ref IN
            SELECT referido_tenant_id
            FROM public.referidos
            WHERE referidor_tenant_id = p_referidor_tenant_id
              AND estado = 'activo'
        LOOP
            PERFORM public.generar_comision_referido(v_ref.referido_tenant_id, to_char(now(), 'YYYY-MM'));
        END LOOP;

        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- ---------------------------------------------
-- 7. Sincronizacion de estado y socios
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.sincronizar_referido_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referidor uuid;
BEGIN
    IF NEW.suscripcion_activa IS DISTINCT FROM OLD.suscripcion_activa
       OR NEW.plan IS DISTINCT FROM OLD.plan THEN

        UPDATE public.referidos
        SET estado = CASE
                WHEN NEW.suscripcion_activa THEN 'activo'
                ELSE 'inactivo'
            END,
            activado_at = CASE
                WHEN NEW.suscripcion_activa THEN COALESCE(activado_at, now())
                ELSE activado_at
            END,
            desactivado_at = CASE
                WHEN NEW.suscripcion_activa THEN NULL
                ELSE now()
            END,
            plan_referido = NEW.plan,
            monto_mensual_referido = public.precio_plan_referido(NEW.plan)
        WHERE referido_tenant_id = NEW.id
        RETURNING referidor_tenant_id INTO v_referidor;

        IF v_referidor IS NOT NULL THEN
            PERFORM public.actualizar_estado_socio(v_referidor);

            IF NEW.suscripcion_activa THEN
                PERFORM public.generar_comision_referido(NEW.id, to_char(now(), 'YYYY-MM'));
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_referidos ON public.tenants;
CREATE TRIGGER trg_tenants_referidos
    AFTER UPDATE OF suscripcion_activa, plan ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.sincronizar_referido_tenant();

CREATE OR REPLACE FUNCTION public.sincronizar_comision_suscripcion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.estado = 'verificado' THEN
        PERFORM public.generar_comision_referido(
            NEW.tenant_id,
            to_char(COALESCE(NEW.fecha_inicio, NEW.created_at, now()), 'YYYY-MM')
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suscripciones_comision ON public.suscripciones;
CREATE TRIGGER trg_suscripciones_comision
    AFTER INSERT OR UPDATE OF estado ON public.suscripciones
    FOR EACH ROW
    EXECUTE FUNCTION public.sincronizar_comision_suscripcion();

-- ---------------------------------------------
-- 8. RPCs del conductor
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_referido(p_codigo text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referidor public.tenants%ROWTYPE;
    v_referido uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    SELECT tenant_id INTO v_referido FROM public.profiles WHERE id = auth.uid();
    IF v_referido IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_referidor
    FROM public.tenants
    WHERE upper(codigo_referido) = upper(trim(p_codigo))
    LIMIT 1;

    IF NOT FOUND OR v_referidor.id = v_referido THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.referidos (
        referidor_tenant_id,
        referido_tenant_id,
        codigo,
        plan_referido,
        monto_mensual_referido
    ) VALUES (
        v_referidor.id,
        v_referido,
        upper(trim(p_codigo)),
        (SELECT plan FROM public.tenants WHERE id = v_referido),
        public.precio_plan_referido((SELECT plan FROM public.tenants WHERE id = v_referido))
    )
    ON CONFLICT (referido_tenant_id) DO NOTHING;

    RETURN v_referidor.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.obtener_mis_referidos()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id uuid := public.tenant_id();
    v_cuenta jsonb;
    v_config jsonb;
    v_referidos jsonb;
    v_comisiones jsonb;
    v_pagos jsonb;
BEGIN
    IF v_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;

    v_cuenta := public.calcular_cuenta_referidos(v_tenant_id);
    SELECT to_jsonb(c) INTO v_config FROM public.config_referidos c WHERE c.id = 1;

    SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_referidos
    FROM (
        SELECT
            r.id,
            r.codigo,
            r.estado,
            r.created_at,
            r.activado_at,
            r.plan_referido AS plan,
            r.monto_mensual_referido AS monto_mensual,
            t.nombre AS referido_nombre,
            t.suscripcion_activa,
            t.fecha_vencimiento
        FROM public.referidos r
        JOIN public.tenants t ON t.id = r.referido_tenant_id
        WHERE r.referidor_tenant_id = v_tenant_id
    ) x;

    SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_comisiones
    FROM (
        SELECT
            c.id,
            c.periodo,
            c.base_monto,
            c.porcentaje,
            c.monto,
            c.estado,
            c.created_at,
            c.pagado_at,
            t.nombre AS referido_nombre
        FROM public.comisiones_referido c
        JOIN public.tenants t ON t.id = c.referido_tenant_id
        WHERE c.referidor_tenant_id = v_tenant_id
    ) x;

    SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_pagos
    FROM (
        SELECT id, monto, metodo, referencia, notas, created_at
        FROM public.pagos_referido
        WHERE referidor_tenant_id = v_tenant_id
    ) x;

    RETURN jsonb_build_object(
        'config', v_config,
        'cuenta', v_cuenta,
        'referidos', v_referidos,
        'comisiones', v_comisiones,
        'pagos', v_pagos
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.guardar_pago_movil_socio(
    p_banco text,
    p_cedula text,
    p_telefono text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id uuid := public.tenant_id();
    v_socio boolean;
BEGIN
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;
    IF nullif(trim(p_banco), '') IS NULL
       OR nullif(trim(p_cedula), '') IS NULL
       OR nullif(trim(p_telefono), '') IS NULL THEN
        RAISE EXCEPTION 'datos_incompletos';
    END IF;

    SELECT socio_drivip INTO v_socio FROM public.tenants WHERE id = v_tenant_id;
    IF NOT COALESCE(v_socio, false) THEN
        RAISE EXCEPTION 'solo_socios';
    END IF;

    UPDATE public.tenants
    SET pago_movil_socio_banco = trim(p_banco),
        pago_movil_socio_cedula = trim(p_cedula),
        pago_movil_socio_telefono = trim(p_telefono),
        pago_movil_socio_actualizado_at = now(),
        updated_at = now()
    WHERE id = v_tenant_id;

    RETURN jsonb_build_object(
        'pago_movil_banco', trim(p_banco),
        'pago_movil_cedula', trim(p_cedula),
        'pago_movil_telefono', trim(p_telefono)
    );
END;
$$;

-- ---------------------------------------------
-- 9. RPCs del superadmin
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.listar_referidos_admin()
RETURNS TABLE (
    id uuid,
    nombre text,
    codigo_referido text,
    plan text,
    referidos_total integer,
    referidos_activos integer,
    socio_drivip boolean,
    socio_desde timestamptz,
    precio_plan numeric,
    descuento_pct numeric,
    monto_descuento numeric,
    total_mensual numeric,
    comisiones_pendientes numeric,
    comisiones_pagadas numeric,
    comisiones_totales numeric,
    pago_movil_banco text,
    pago_movil_cedula text,
    pago_movil_telefono text,
    ultimo_pago_at timestamptz
)
LANGUAGE plpgsql
STABLE
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
        t.codigo_referido,
        t.plan,
        COALESCE(ref.total, 0)::integer,
        COALESCE(ref.activos, 0)::integer,
        t.socio_drivip,
        t.socio_desde,
        public.precio_plan_referido(t.plan),
        least(100, COALESCE(ref.activos, 0) * c.descuento_por_referido_pct),
        round(public.precio_plan_referido(t.plan) * least(100, COALESCE(ref.activos, 0) * c.descuento_por_referido_pct) / 100.0, 2),
        greatest(0, round(public.precio_plan_referido(t.plan) - (public.precio_plan_referido(t.plan) * least(100, COALESCE(ref.activos, 0) * c.descuento_por_referido_pct) / 100.0), 2)),
        COALESCE(com.pendientes, 0),
        COALESCE(com.pagadas, 0),
        COALESCE(com.pendientes, 0) + COALESCE(com.pagadas, 0),
        t.pago_movil_socio_banco,
        t.pago_movil_socio_cedula,
        t.pago_movil_socio_telefono,
        (SELECT max(p.created_at) FROM public.pagos_referido p WHERE p.referidor_tenant_id = t.id)
    FROM public.tenants t
    CROSS JOIN public.config_referidos c
    LEFT JOIN LATERAL (
        SELECT
            count(*) AS total,
            count(*) FILTER (WHERE r.estado = 'activo') AS activos
        FROM public.referidos r
        WHERE r.referidor_tenant_id = t.id
    ) ref ON true
    LEFT JOIN LATERAL (
        SELECT
            COALESCE(sum(co.monto) FILTER (WHERE co.estado = 'pendiente'), 0) AS pendientes,
            COALESCE(sum(co.monto) FILTER (WHERE co.estado = 'pagado'), 0) AS pagadas
        FROM public.comisiones_referido co
        WHERE co.referidor_tenant_id = t.id
    ) com ON true
    WHERE c.id = 1
      AND (COALESCE(ref.total, 0) > 0 OR t.socio_drivip)
    ORDER BY COALESCE(com.pendientes, 0) DESC, COALESCE(ref.activos, 0) DESC, t.nombre;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_referidos_detalle_admin()
RETURNS TABLE (
    id uuid,
    referidor_tenant_id uuid,
    referidor_nombre text,
    referido_tenant_id uuid,
    referido_nombre text,
    codigo text,
    estado text,
    plan text,
    monto_mensual numeric,
    created_at timestamptz,
    activado_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.referidor_tenant_id,
        ref.nombre,
        r.referido_tenant_id,
        rei.nombre,
        r.codigo,
        r.estado,
        COALESCE(r.plan_referido, rei.plan),
        COALESCE(NULLIF(r.monto_mensual_referido, 0), public.precio_plan_referido(rei.plan)),
        r.created_at,
        r.activado_at
    FROM public.referidos r
    JOIN public.tenants ref ON ref.id = r.referidor_tenant_id
    JOIN public.tenants rei ON rei.id = r.referido_tenant_id
    ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.pagar_comisiones_referido(
    p_referidor_tenant_id uuid,
    p_metodo text DEFAULT 'pago_movil',
    p_referencia text DEFAULT NULL,
    p_notas text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total numeric;
    v_pago_id uuid;
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    SELECT COALESCE(sum(monto), 0) INTO v_total
    FROM public.comisiones_referido
    WHERE referidor_tenant_id = p_referidor_tenant_id
      AND estado = 'pendiente';

    IF v_total <= 0 THEN
        RAISE EXCEPTION 'sin_comisiones_pendientes';
    END IF;

    INSERT INTO public.pagos_referido (
        referidor_tenant_id, monto, metodo, referencia, notas, pagado_por
    ) VALUES (
        p_referidor_tenant_id, v_total, p_metodo, p_referencia, p_notas, 'superadmin'
    )
    RETURNING id INTO v_pago_id;

    UPDATE public.comisiones_referido
    SET estado = 'pagado',
        pago_id = v_pago_id,
        pagado_at = now()
    WHERE referidor_tenant_id = p_referidor_tenant_id
      AND estado = 'pendiente';

    INSERT INTO public.tenant_notificaciones (
        tenant_id, titulo, mensaje, tipo, enviada, enviada_at
    ) VALUES (
        p_referidor_tenant_id,
        'Comisiones de referidos pagadas',
        'Drivip registro el pago de $' || v_total::text || ' por tus comisiones de referidos. Revisa tu billetera para ver el detalle.',
        'sistema',
        true,
        now()
    );

    RETURN v_pago_id;
END;
$$;

-- ---------------------------------------------
-- 10. Datos existentes y permisos
-- ---------------------------------------------
UPDATE public.referidos r
SET estado = CASE WHEN t.suscripcion_activa THEN 'activo' ELSE 'pendiente' END,
    activado_at = CASE WHEN t.suscripcion_activa THEN COALESCE(r.activado_at, now()) ELSE r.activado_at END,
    plan_referido = t.plan,
    monto_mensual_referido = public.precio_plan_referido(t.plan)
FROM public.tenants t
WHERE t.id = r.referido_tenant_id;

DO $$
DECLARE
    v_referidor record;
BEGIN
    FOR v_referidor IN
        SELECT DISTINCT referidor_tenant_id
        FROM public.referidos
    LOOP
        PERFORM public.actualizar_estado_socio(v_referidor.referidor_tenant_id);
    END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.generar_comision_referido(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.actualizar_estado_socio(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sincronizar_referido_tenant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sincronizar_comision_suscripcion() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.precio_plan_referido(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.contar_referidos_activos(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calcular_cuenta_referidos(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generar_comisiones_mes_referidos() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.registrar_referido(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.obtener_mis_referidos() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guardar_pago_movil_socio(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.listar_referidos_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.listar_referidos_detalle_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pagar_comisiones_referido(uuid, text, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.calcular_cuenta_referidos(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generar_comisiones_mes_referidos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_referido(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_mis_referidos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_pago_movil_socio(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_referidos_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_referidos_detalle_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pagar_comisiones_referido(uuid, text, text, text) TO authenticated;

-- Cron mensual opcional: genera comisiones del mes el dia 1 a las 13:00.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drivip_comisiones_referidos') THEN
            PERFORM cron.unschedule('drivip_comisiones_referidos');
        END IF;
        PERFORM cron.schedule(
            'drivip_comisiones_referidos',
            '0 13 1 * *',
            $cron$SELECT public.generar_comisiones_mes_referidos();$cron$
        );
    END IF;
EXCEPTION
    WHEN invalid_schema_name OR undefined_table OR undefined_function THEN
        NULL;
END $$;

NOTIFY pgrst, 'reload schema';
