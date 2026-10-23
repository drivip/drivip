-- Drivip - indices de consultas frecuentes, proteccion de reservas y ACL de tarifas.
-- Aplicar con: supabase db query --linked -f database/migrations/2026-11-08_indices_reservas_y_acl.sql

-- =============================================
-- 1. Indices para listados ordenados por fecha
-- =============================================
CREATE INDEX IF NOT EXISTS idx_carreras_tenant_created
    ON public.carreras(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carreras_cliente_created
    ON public.carreras(cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado_created
    ON public.suscripciones(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_conductor_timestamp
    ON public.ubicaciones(conductor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente_updated
    ON public.conversaciones(cliente_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversaciones_tenant_updated
    ON public.conversaciones(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente_fecha
    ON public.reservas(cliente_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_reservas_conductor_fecha
    ON public.reservas(conductor_tenant_id, fecha_hora);

-- =============================================
-- 2. Reservas: separar policies por operacion y
--    permitir al conductor confirmar/cancelar.
-- =============================================
DROP POLICY IF EXISTS "reservas_cliente_all" ON public.reservas;

DROP POLICY IF EXISTS "reservas_cliente_select" ON public.reservas;
CREATE POLICY "reservas_cliente_select"
ON public.reservas FOR SELECT
TO authenticated
USING (cliente_id = auth.uid());

DROP POLICY IF EXISTS "reservas_cliente_insert" ON public.reservas;
CREATE POLICY "reservas_cliente_insert"
ON public.reservas FOR INSERT
TO authenticated
WITH CHECK (cliente_id = auth.uid() AND estado = 'pendiente');

DROP POLICY IF EXISTS "reservas_cliente_update" ON public.reservas;
CREATE POLICY "reservas_cliente_update"
ON public.reservas FOR UPDATE
TO authenticated
USING (cliente_id = auth.uid())
WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "reservas_cliente_delete" ON public.reservas;
CREATE POLICY "reservas_cliente_delete"
ON public.reservas FOR DELETE
TO authenticated
USING (cliente_id = auth.uid() AND estado = 'pendiente');

DROP POLICY IF EXISTS "reservas_conductor_update" ON public.reservas;
CREATE POLICY "reservas_conductor_update"
ON public.reservas FOR UPDATE
TO authenticated
USING (conductor_tenant_id = public.tenant_id())
WITH CHECK (conductor_tenant_id = public.tenant_id());

DROP POLICY IF EXISTS "reservas_superadmin_all" ON public.reservas;
CREATE POLICY "reservas_superadmin_all"
ON public.reservas FOR ALL
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- =============================================
-- 3. Trigger: el cliente solo cancela; el conductor
--    solo cambia estado con transiciones validas.
-- =============================================
CREATE OR REPLACE FUNCTION public.proteger_reserva_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role text := COALESCE(auth.role(), current_user::text);
    v_tenant uuid := public.tenant_id();
BEGIN
    IF v_role NOT IN ('authenticated', 'anon') THEN
        RETURN NEW;
    END IF;

    IF public.is_superadmin() THEN
        RETURN NEW;
    END IF;

    IF OLD.cliente_id = auth.uid() THEN
        IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
           OR NEW.conductor_tenant_id IS DISTINCT FROM OLD.conductor_tenant_id
           OR NEW.origen IS DISTINCT FROM OLD.origen
           OR NEW.destino IS DISTINCT FROM OLD.destino
           OR NEW.origen_lat IS DISTINCT FROM OLD.origen_lat
           OR NEW.origen_lng IS DISTINCT FROM OLD.origen_lng
           OR NEW.destino_lat IS DISTINCT FROM OLD.destino_lat
           OR NEW.destino_lng IS DISTINCT FROM OLD.destino_lng
           OR NEW.fecha_hora IS DISTINCT FROM OLD.fecha_hora
           OR NEW.notas IS DISTINCT FROM OLD.notas
           OR NEW.precio_usd IS DISTINCT FROM OLD.precio_usd
        THEN
            RAISE EXCEPTION 'reserva_campos_inmutables';
        END IF;

        IF NEW.estado IS DISTINCT FROM OLD.estado
           AND (
               NEW.estado <> 'cancelada'
               OR OLD.estado NOT IN ('pendiente', 'confirmada')
           )
        THEN
            RAISE EXCEPTION 'reserva_transicion_invalida';
        END IF;

        RETURN NEW;
    END IF;

    IF v_tenant IS NOT NULL AND OLD.conductor_tenant_id = v_tenant THEN
        IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
           OR NEW.conductor_tenant_id IS DISTINCT FROM OLD.conductor_tenant_id
           OR NEW.origen IS DISTINCT FROM OLD.origen
           OR NEW.destino IS DISTINCT FROM OLD.destino
           OR NEW.origen_lat IS DISTINCT FROM OLD.origen_lat
           OR NEW.origen_lng IS DISTINCT FROM OLD.origen_lng
           OR NEW.destino_lat IS DISTINCT FROM OLD.destino_lat
           OR NEW.destino_lng IS DISTINCT FROM OLD.destino_lng
           OR NEW.fecha_hora IS DISTINCT FROM OLD.fecha_hora
           OR NEW.notas IS DISTINCT FROM OLD.notas
           OR NEW.precio_usd IS DISTINCT FROM OLD.precio_usd
        THEN
            RAISE EXCEPTION 'reserva_campos_inmutables';
        END IF;

        IF NEW.estado IS DISTINCT FROM OLD.estado
           AND NOT (
               (OLD.estado = 'pendiente' AND NEW.estado IN ('confirmada', 'cancelada'))
               OR (OLD.estado = 'confirmada' AND NEW.estado IN ('completada', 'cancelada'))
           )
        THEN
            RAISE EXCEPTION 'reserva_transicion_invalida';
        END IF;

        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'reserva_no_autorizada';
END;
$$;

DROP TRIGGER IF EXISTS proteger_reserva_update ON public.reservas;
CREATE TRIGGER proteger_reserva_update
    BEFORE UPDATE ON public.reservas
    FOR EACH ROW
    EXECUTE FUNCTION public.proteger_reserva_update();

-- =============================================
-- 4. get_tarifas_tenant: solo usuarios autenticados.
--    La landing publica no usa esta RPC.
-- =============================================
REVOKE EXECUTE ON FUNCTION public.get_tarifas_tenant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tarifas_tenant(uuid) TO authenticated;
