-- =============================================
-- Migracion: flujo real de carrera cliente -> conductor
-- Fecha: 2026-10-22
-- Descripcion:
--   Bajo el RLS original, `carreras` solo permitia filas donde
--   tenant_id = tenant_id() (el conductor). Un cliente no tiene
--   tenant propio (profiles.tenant_id es NULL), por lo que NO podia
--   crear ni leer sus carreras: la app del cliente funcionaba solo
--   con datos de ejemplo.
--
--   Esta migracion habilita el ciclo completo:
--     1. El cliente lee/crea/actualiza SOLO sus propias carreras.
--     2. El cliente ve la ubicacion GPS de los conductores de su red.
--     3. RPC get_conductores_red: info publica de los conductores que
--        el cliente agrego (incluye telefono para poder contactarlos).
--     4. RPC crear_carrera_cliente: valida que el conductor este en la
--        red del cliente y crea la carrera.
--     5. RPC calificar_carrera / cancelar_carrera.
-- =============================================

-- =============================================
-- 0. Realtime: publicar carreras y ubicaciones para que el cliente
--    y el conductor reciban los cambios en vivo.
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'carreras'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.carreras;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ubicaciones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ubicaciones;
    END IF;
END $$;

-- =============================================
-- 1. CARRERAS: el cliente ve y crea sus propias carreras.
--    (Las policies existentes del conductor se mantienen; RLS evalua OR)
-- =============================================
DROP POLICY IF EXISTS "carreras_cliente_select" ON carreras;
CREATE POLICY "carreras_cliente_select"
ON carreras FOR SELECT
TO authenticated
USING (cliente_id = auth.uid());

DROP POLICY IF EXISTS "carreras_cliente_insert" ON carreras;
CREATE POLICY "carreras_cliente_insert"
ON carreras FOR INSERT
TO authenticated
WITH CHECK (
    cliente_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM red_cliente rc
        WHERE rc.cliente_id = auth.uid()
          AND rc.conductor_tenant_id = carreras.tenant_id
    )
);

DROP POLICY IF EXISTS "carreras_cliente_update" ON carreras;
CREATE POLICY "carreras_cliente_update"
ON carreras FOR UPDATE
TO authenticated
USING (cliente_id = auth.uid())
WITH CHECK (cliente_id = auth.uid());

-- =============================================
-- 2. UBICACIONES: el cliente sigue el GPS de conductores de su red.
-- =============================================
DROP POLICY IF EXISTS "ubicaciones_cliente_red" ON ubicaciones;
CREATE POLICY "ubicaciones_cliente_red"
ON ubicaciones FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM red_cliente rc
        WHERE rc.cliente_id = auth.uid()
          AND rc.conductor_tenant_id = ubicaciones.conductor_id
    )
);

-- =============================================
-- 3. get_conductores_red: info publica de los conductores del cliente.
-- =============================================
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
    pausado boolean,
    suscripcion_activa boolean,
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
           t.pausado,
           t.suscripcion_activa,
           rc.apodo,
           rc.favorito,
           rc.agregado_at
    FROM red_cliente rc
    JOIN tenants t ON t.id = rc.conductor_tenant_id
    WHERE rc.cliente_id = auth.uid()
    ORDER BY rc.favorito DESC, rc.agregado_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_conductores_red() TO authenticated;

-- =============================================
-- 4. crear_carrera_cliente: valida la red y crea la carrera.
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

    -- Ficha del cliente para el panel del conductor (Mis Clientes).
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
        p_distancia_km, p_duracion_min, GREATEST(COALESCE(p_precio, 0), 0),
        p_metodo_pago::metodo_pago, 'pendiente'
    )
    RETURNING * INTO v_carrera;

    RETURN to_jsonb(v_carrera);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_carrera_cliente(uuid, double precision, double precision, text, double precision, double precision, text, double precision, double precision, double precision, text) TO authenticated;

-- =============================================
-- 5. calificar_carrera: el cliente califica su viaje y se
--    recalcula el promedio del conductor.
-- =============================================
CREATE OR REPLACE FUNCTION public.calificar_carrera(
    p_carrera_id uuid,
    p_calificacion double precision,
    p_comentario text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente uuid := auth.uid();
    v_tenant uuid;
BEGIN
    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF p_calificacion IS NULL OR p_calificacion < 1 OR p_calificacion > 5 THEN
        RAISE EXCEPTION 'calificacion_invalida';
    END IF;

    UPDATE carreras
    SET calificacion = p_calificacion,
        comentario_calificacion = p_comentario
    WHERE id = p_carrera_id
      AND cliente_id = v_cliente
    RETURNING tenant_id INTO v_tenant;

    IF v_tenant IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE tenants t
    SET calificacion = sub.avg
    FROM (
        SELECT ROUND(AVG(calificacion)::numeric, 2) AS avg
        FROM carreras
        WHERE tenant_id = v_tenant
          AND calificacion IS NOT NULL
    ) sub
    WHERE t.id = v_tenant;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calificar_carrera(uuid, double precision, text) TO authenticated;

-- =============================================
-- 6. cancelar_carrera: el cliente cancela su carrera.
-- =============================================
CREATE OR REPLACE FUNCTION public.cancelar_carrera(p_carrera_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente uuid := auth.uid();
BEGIN
    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    UPDATE carreras
    SET estado = 'cancelada',
        cancelada_at = NOW()
    WHERE id = p_carrera_id
      AND cliente_id = v_cliente
      AND estado IN ('pendiente', 'aceptada');

    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancelar_carrera(uuid) TO authenticated;
