-- Fase 0: cierre de accesos cruzados entre tenants.
-- Aplicar antes de desplegar cualquier cambio de frontend que dependa de estas reglas.

-- 1. El perfil no puede cambiar tenant, rol ni estado activo por su cuenta.
CREATE OR REPLACE FUNCTION public.proteger_campos_perfil()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- auth.uid() NULL = service role o SQL administrativo.
    IF auth.uid() IS NOT NULL AND NOT public.is_superadmin() THEN
        IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
            RAISE EXCEPTION 'tenant_id_inmutable';
        END IF;
        IF NEW.rol IS DISTINCT FROM OLD.rol THEN
            RAISE EXCEPTION 'rol_inmutable';
        END IF;
        IF NEW.activo IS DISTINCT FROM OLD.activo THEN
            RAISE EXCEPTION 'activo_inmutable';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_proteger ON public.profiles;
CREATE TRIGGER trg_profiles_proteger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_perfil();

REVOKE ALL ON FUNCTION public.proteger_campos_perfil() FROM PUBLIC;

-- 2. El cliente crea y modifica carreras solo por RPC.
DROP POLICY IF EXISTS "carreras_cliente_insert" ON public.carreras;
DROP POLICY IF EXISTS "carreras_cliente_update" ON public.carreras;

-- 3. Helper para consultar la ultima ubicacion sin recursion de RLS.
CREATE OR REPLACE FUNCTION public.es_ultima_ubicacion(p_conductor_id uuid, p_ubicacion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p_ubicacion_id = (
        SELECT u.id
        FROM public.ubicaciones u
        WHERE u.conductor_id = p_conductor_id
        ORDER BY u.timestamp DESC, u.id DESC
        LIMIT 1
    );
$$;

REVOKE ALL ON FUNCTION public.es_ultima_ubicacion(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_ultima_ubicacion(uuid, uuid) TO authenticated;

-- 4. El cliente solo ve la ultima posicion del conductor.
--    Durante un viaje activo puede ver el tramo reciente para seguimiento.
DROP POLICY IF EXISTS "ubicaciones_cliente_red" ON public.ubicaciones;
CREATE POLICY "ubicaciones_cliente_red"
ON public.ubicaciones FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.red_cliente rc
        WHERE rc.cliente_id = auth.uid()
          AND rc.conductor_tenant_id = ubicaciones.conductor_id
    )
    AND (
        public.es_ultima_ubicacion(ubicaciones.conductor_id, ubicaciones.id)
        OR (
            ubicaciones.timestamp > now() - interval '2 hours'
            AND EXISTS (
                SELECT 1 FROM public.carreras c
                WHERE c.cliente_id = auth.uid()
                  AND c.tenant_id = ubicaciones.conductor_id
                  AND c.estado IN ('aceptada', 'en_curso')
            )
        )
    )
);

-- 5. Las suscripciones push deben pertenecer al tenant real del usuario.
DROP POLICY IF EXISTS "push_subs_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subs_insert_own"
ON public.push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR tenant_id = public.tenant_id())
);

DROP POLICY IF EXISTS "push_subs_update_own" ON public.push_subscriptions;
CREATE POLICY "push_subs_update_own"
ON public.push_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR tenant_id = public.tenant_id())
);

-- 6. Validacion y tarifa de carreras en servidor.
CREATE OR REPLACE FUNCTION public.preparar_carrera_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_straight_km double precision;
    v_modo text;
    v_base numeric;
    v_por_km numeric;
    v_tiene_zonas boolean;
BEGIN
    -- 6.1 El cliente no puede pedir a un conductor pausado o inactivo.
    IF NEW.cliente_id IS NOT NULL AND NEW.cliente_id = auth.uid() THEN
        IF EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = NEW.tenant_id
              AND (t.pausado OR NOT t.suscripcion_activa)
        ) THEN
            RAISE EXCEPTION 'conductor_no_disponible';
        END IF;

        -- 6.2 Distancia coherente para viaje y delivery.
        IF NEW.tipo_servicio IN ('viaje', 'delivery')
           AND NEW.origen_lat IS NOT NULL AND NEW.origen_lng IS NOT NULL
           AND NEW.destino_lat IS NOT NULL AND NEW.destino_lng IS NOT NULL THEN
            v_straight_km := 6371 * 2 * asin(sqrt(
                power(sin(radians(NEW.destino_lat - NEW.origen_lat) / 2), 2)
                + cos(radians(NEW.origen_lat)) * cos(radians(NEW.destino_lat))
                * power(sin(radians(NEW.destino_lng - NEW.origen_lng) / 2), 2)
            ));
            IF COALESCE(NEW.distancia_km, 0) < v_straight_km * 0.95 THEN
                RAISE EXCEPTION 'distancia_invalida';
            END IF;
        END IF;
    END IF;

    -- 6.3 Delivery: el precio se calcula en servidor.
    IF NEW.tipo_servicio = 'delivery' THEN
        SELECT tarifa_modo, tarifa_base, tarifa_por_km
        INTO v_modo, v_base, v_por_km
        FROM public.tenants
        WHERE id = NEW.tenant_id;

        IF v_modo = 'km' THEN
            NEW.precio := ROUND(
                GREATEST(v_base + v_por_km * GREATEST(COALESCE(NEW.distancia_km, 0), 0), 0)::numeric,
                2
            )::double precision;
        ELSIF v_modo = 'zona' THEN
            SELECT EXISTS (
                SELECT 1 FROM public.zonas z WHERE z.tenant_id = NEW.tenant_id
            ) INTO v_tiene_zonas;

            IF v_tiene_zonas THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.zonas z
                    WHERE z.tenant_id = NEW.tenant_id
                      AND ROUND(z.precio, 2) = ROUND(COALESCE(NEW.precio, 0)::numeric, 2)
                ) THEN
                    RAISE EXCEPTION 'precio_no_corresponde_a_zona';
                END IF;
            ELSE
                NEW.precio := ROUND(
                    GREATEST(v_base + v_por_km * GREATEST(COALESCE(NEW.distancia_km, 0), 0), 0)::numeric,
                    2
                )::double precision;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carreras_preparar ON public.carreras;
CREATE TRIGGER trg_carreras_preparar
BEFORE INSERT ON public.carreras
FOR EACH ROW EXECUTE FUNCTION public.preparar_carrera_insert();

REVOKE ALL ON FUNCTION public.preparar_carrera_insert() FROM PUBLIC;

-- 7. Una carrera solo se califica una vez y estando completada.
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

    UPDATE public.carreras
    SET calificacion = p_calificacion,
        comentario_calificacion = p_comentario
    WHERE id = p_carrera_id
      AND cliente_id = v_cliente
      AND estado = 'completada'
      AND calificacion IS NULL
    RETURNING tenant_id INTO v_tenant;

    IF v_tenant IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.tenants t
    SET calificacion = sub.avg
    FROM (
        SELECT ROUND(AVG(calificacion)::numeric, 2) AS avg
        FROM public.carreras
        WHERE tenant_id = v_tenant
          AND calificacion IS NOT NULL
          AND estado = 'completada'
    ) sub
    WHERE t.id = v_tenant;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.calificar_carrera(uuid, double precision, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calificar_carrera(uuid, double precision, text) TO authenticated;
