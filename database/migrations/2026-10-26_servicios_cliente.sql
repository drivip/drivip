-- =============================================
-- Migracion: delivery y servicio de compra desde el cliente
-- Fecha: 2026-10-26
-- Descripcion:
--   Agrega el tipo y detalle del servicio a las carreras y permite
--   crear solicitudes de delivery o compra para un conductor de la red.
--   En compra el precio inicial es 0: el conductor lo cotiza despues.
-- =============================================

ALTER TABLE public.carreras
    ADD COLUMN IF NOT EXISTS tipo_servicio text NOT NULL DEFAULT 'viaje',
    ADD COLUMN IF NOT EXISTS detalle_servicio text;

ALTER TABLE public.carreras
    DROP CONSTRAINT IF EXISTS carreras_tipo_servicio_check;

ALTER TABLE public.carreras
    ADD CONSTRAINT carreras_tipo_servicio_check
    CHECK (tipo_servicio IN ('viaje', 'delivery', 'compra'));

COMMENT ON COLUMN public.carreras.tipo_servicio IS
    'Tipo de solicitud: viaje, delivery o compra.';
COMMENT ON COLUMN public.carreras.detalle_servicio IS
    'Descripcion del paquete o de lo que el cliente necesita comprar.';

CREATE INDEX IF NOT EXISTS idx_carreras_tipo_servicio
    ON public.carreras(tipo_servicio);

CREATE OR REPLACE FUNCTION public.crear_solicitud_servicio(
    p_conductor_tenant_id uuid,
    p_tipo_servicio text,
    p_detalle_servicio text,
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
BEGIN
    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF p_tipo_servicio NOT IN ('delivery', 'compra') THEN
        RAISE EXCEPTION 'tipo_servicio_invalido: %', p_tipo_servicio;
    END IF;

    IF length(trim(COALESCE(p_detalle_servicio, ''))) < 3 THEN
        RAISE EXCEPTION 'detalle_servicio_requerido';
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

    IF p_origen_lat IS NULL OR p_origen_lng IS NULL
       OR p_destino_lat IS NULL OR p_destino_lng IS NULL THEN
        RAISE EXCEPTION 'ubicaciones_requeridas';
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
        metodo_pago, tipo_servicio, detalle_servicio, estado
    ) VALUES (
        p_conductor_tenant_id, p_conductor_tenant_id, v_cliente,
        p_origen_lat, p_origen_lng, p_origen_direccion,
        p_destino_lat, p_destino_lng, p_destino_direccion,
        p_distancia_km, p_duracion_min,
        CASE WHEN p_tipo_servicio = 'compra' THEN 0
             ELSE GREATEST(COALESCE(p_precio, 0), 0) END,
        p_metodo_pago::metodo_pago, p_tipo_servicio, trim(p_detalle_servicio), 'pendiente'
    )
    RETURNING * INTO v_carrera;

    RETURN to_jsonb(v_carrera);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_solicitud_servicio(
    uuid, text, text,
    double precision, double precision, text,
    double precision, double precision, text,
    double precision, double precision, double precision, text
) TO authenticated;
