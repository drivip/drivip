-- =============================================
-- Canje de cupones por codigo al pedir un viaje
-- Fecha: 2026-11-02
-- Descripcion:
--   1. validar_cupon_codigo: valida un codigo del conductor elegido sin
--      consumirlo, para mostrar el descuento antes de solicitar el viaje.
--   2. crear_carrera_cliente acepta p_cupon_codigo, aplica el descuento
--      sobre la tarifa calculada por el servidor y marca el cupon usado.
-- =============================================

CREATE OR REPLACE FUNCTION public.validar_cupon_codigo(
    p_cupon_codigo text,
    p_conductor_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente uuid := auth.uid();
    v_codigo text := UPPER(REGEXP_REPLACE(COALESCE(p_cupon_codigo, ''), '\s+', '', 'g'));
    v_cupon public.cupones%ROWTYPE;
    v_envio public.cupon_envios%ROWTYPE;
    v_conductor text;
BEGIN
    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF v_codigo = '' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'codigo_vacio');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.red_cliente rc
        WHERE rc.cliente_id = v_cliente
          AND rc.conductor_tenant_id = p_conductor_tenant_id
    ) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'conductor_no_en_red');
    END IF;

    SELECT c.* INTO v_cupon
    FROM public.cupones c
    WHERE c.tenant_id = p_conductor_tenant_id
      AND c.codigo = v_codigo;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_no_encontrado');
    END IF;

    IF NOT v_cupon.activo THEN
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_inactivo');
    END IF;

    IF v_cupon.valido_hasta IS NOT NULL AND v_cupon.valido_hasta <= NOW() THEN
        RETURN jsonb_build_object('ok', false, 'error', 'cupon_vencido');
    END IF;

    SELECT e.* INTO v_envio
    FROM public.cupon_envios e
    WHERE e.cupon_id = v_cupon.id
      AND e.cliente_id = v_cliente;

    IF FOUND THEN
        IF v_envio.estado = 'usado' THEN
            RETURN jsonb_build_object('ok', false, 'error', 'cupon_ya_usado');
        END IF;

        IF v_envio.estado = 'vencido' THEN
            RETURN jsonb_build_object('ok', false, 'error', 'cupon_vencido');
        END IF;
    END IF;

    SELECT t.nombre INTO v_conductor
    FROM public.tenants t
    WHERE t.id = v_cupon.tenant_id;

    RETURN jsonb_build_object(
        'ok', true,
        'cupon_id', v_cupon.id,
        'codigo', v_cupon.codigo,
        'tipo', v_cupon.tipo,
        'valor', v_cupon.valor,
        'conductor', v_conductor,
        'valido_hasta', v_cupon.valido_hasta
    );
END;
$$;

REVOKE ALL ON FUNCTION public.validar_cupon_codigo(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_cupon_codigo(text, uuid) TO authenticated;

-- La version anterior tenia 11 parametros. Se elimina para evitar
-- ambiguedad al llamar la RPC con el parametro opcional del cupon.
DROP FUNCTION IF EXISTS public.crear_carrera_cliente(
    uuid, double precision, double precision, text,
    double precision, double precision, text,
    double precision, double precision, double precision, text
);

CREATE OR REPLACE FUNCTION public.crear_carrera_cliente(
    p_conductor_tenant_id uuid,
    p_origen_lat double precision,
    p_origen_lng double precision,
    p_origen_direccion text,
    p_destino_lat double precision,
    p_destino_lng double precision,
    p_destino_direccion text,
    p_distancia_km double precision,
    p_duracion_min double precision,
    p_precio double precision,
    p_metodo_pago text,
    p_cupon_codigo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente uuid := auth.uid();
    v_carrera carreras;
    v_nombre text;
    v_telefono text;
    v_email text;
    v_modo text;
    v_base numeric;
    v_por_km numeric;
    v_distancia double precision;
    v_precio double precision;
    v_codigo text := UPPER(REGEXP_REPLACE(COALESCE(p_cupon_codigo, ''), '\s+', '', 'g'));
    v_cupon public.cupones%ROWTYPE;
    v_envio public.cupon_envios%ROWTYPE;
    v_descuento double precision := 0;
BEGIN
    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM red_cliente rc
        WHERE rc.cliente_id = v_cliente
          AND rc.conductor_tenant_id = p_conductor_tenant_id
    ) THEN
        RAISE EXCEPTION 'conductor_no_en_red';
    END IF;

    IF p_metodo_pago NOT IN ('efectivo', 'pago_movil', 'transferencia') THEN
        RAISE EXCEPTION 'metodo_pago_invalido: %', p_metodo_pago;
    END IF;

    SELECT tarifa_modo, tarifa_base, tarifa_por_km
    INTO v_modo, v_base, v_por_km
    FROM tenants
    WHERE id = p_conductor_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'conductor_no_existe';
    END IF;

    v_distancia := GREATEST(COALESCE(p_distancia_km, 0), 0);

    IF v_modo = 'km' THEN
        v_precio := ROUND(
            GREATEST(v_base + (v_por_km * v_distancia), 0)::numeric,
            2
        )::double precision;
    ELSIF v_modo = 'zona' THEN
        v_precio := ROUND(GREATEST(COALESCE(p_precio, 0), 0)::numeric, 2)::double precision;
        IF EXISTS (
            SELECT 1 FROM zonas z WHERE z.tenant_id = p_conductor_tenant_id
        ) AND NOT EXISTS (
            SELECT 1 FROM zonas z
            WHERE z.tenant_id = p_conductor_tenant_id
              AND ROUND(z.precio, 2) = v_precio::numeric
        ) THEN
            RAISE EXCEPTION 'precio_no_corresponde_a_zona';
        END IF;
    ELSE
        v_precio := GREATEST(COALESCE(p_precio, 0), 0);
    END IF;

    IF v_codigo <> '' THEN
        -- Bloquea el cupon para que dos solicitudes simultaneas no puedan
        -- canjearlo dos veces.
        SELECT c.* INTO v_cupon
        FROM public.cupones c
        WHERE c.tenant_id = p_conductor_tenant_id
          AND c.codigo = v_codigo
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'cupon_no_encontrado';
        END IF;

        IF NOT v_cupon.activo THEN
            RAISE EXCEPTION 'cupon_inactivo';
        END IF;

        IF v_cupon.valido_hasta IS NOT NULL AND v_cupon.valido_hasta <= NOW() THEN
            RAISE EXCEPTION 'cupon_vencido';
        END IF;

        SELECT e.* INTO v_envio
        FROM public.cupon_envios e
        WHERE e.cupon_id = v_cupon.id
          AND e.cliente_id = v_cliente
        FOR UPDATE;

        IF FOUND THEN
            IF v_envio.estado = 'usado' THEN
                RAISE EXCEPTION 'cupon_ya_usado';
            END IF;

            IF v_envio.estado = 'vencido' THEN
                RAISE EXCEPTION 'cupon_vencido';
            END IF;
        END IF;

        IF v_cupon.tipo = 'porcentaje' THEN
            v_descuento := ROUND(
                (v_precio * LEAST(v_cupon.valor, 100) / 100)::numeric,
                2
            )::double precision;
        ELSE
            v_descuento := ROUND(
                GREATEST(v_cupon.valor, 0)::numeric,
                2
            )::double precision;
        END IF;

        v_precio := ROUND(
            GREATEST(v_precio - v_descuento, 0)::numeric,
            2
        )::double precision;
    END IF;

    SELECT NULLIF(trim(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), ''),
           p.telefono,
           u.email
    INTO v_nombre, v_telefono, v_email
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.id = v_cliente;

    UPDATE clientes
    SET total_carreras = total_carreras + 1,
        nombre = COALESCE(v_nombre, nombre),
        telefono = COALESCE(v_telefono, telefono),
        email = COALESCE(v_email, email),
        lat = p_origen_lat,
        lng = p_origen_lng
    WHERE tenant_id = p_conductor_tenant_id
      AND profile_id = v_cliente;

    IF NOT FOUND THEN
        INSERT INTO clientes (tenant_id, profile_id, nombre, telefono, email, lat, lng, total_carreras)
        VALUES (p_conductor_tenant_id, v_cliente, COALESCE(v_nombre, 'Cliente'), v_telefono, v_email,
                p_origen_lat, p_origen_lng, 1);
    END IF;

    INSERT INTO carreras (
        tenant_id, conductor_id, cliente_id,
        origen_lat, origen_lng, origen_direccion,
        destino_lat, destino_lng, destino_direccion,
        distancia_km, duracion_min, precio,
        metodo_pago, estado
    ) VALUES (
        p_conductor_tenant_id, p_conductor_tenant_id, v_cliente,
        p_origen_lat, p_origen_lng, p_origen_direccion,
        p_destino_lat, p_destino_lng, p_destino_direccion,
        v_distancia, p_duracion_min, v_precio,
        p_metodo_pago::metodo_pago, 'pendiente'
    )
    RETURNING * INTO v_carrera;

    IF v_cupon.id IS NOT NULL THEN
        IF v_envio.id IS NULL THEN
            INSERT INTO public.cupon_envios (
                cupon_id, tenant_id, cliente_id, estado, usado_at, carrera_id
            ) VALUES (
                v_cupon.id, v_cupon.tenant_id, v_cliente, 'usado', NOW(), v_carrera.id
            );
        ELSE
            UPDATE public.cupon_envios
            SET estado = 'usado',
                usado_at = NOW(),
                carrera_id = v_carrera.id
            WHERE id = v_envio.id;
        END IF;
    END IF;

    RETURN to_jsonb(v_carrera);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_carrera_cliente(
    uuid, double precision, double precision, text,
    double precision, double precision, text,
    double precision, double precision, double precision, text, text
) TO authenticated;
