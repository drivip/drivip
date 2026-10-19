-- =============================================
-- Precio calculado en el servidor
-- Fecha: 2026-10-22
-- Descripción:
--   El cliente enviaba el precio y el RPC lo guardaba tal cual, por
--   lo que una petición manipulada podía crear carreras por $0.
--   Ahora el servidor aplica la tarifa del conductor:
--     - modo 'km': base + $/km * distancia.
--     - modo 'zona': el precio debe coincidir con una zona configurada.
-- =============================================

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
    p_metodo_pago text
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

    RETURN to_jsonb(v_carrera);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_carrera_cliente(uuid, double precision, double precision, text, double precision, double precision, text, double precision, double precision, double precision, text) TO authenticated;
