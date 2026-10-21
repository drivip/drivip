-- =============================================
-- Metodos de pago del conductor visibles para el cliente
-- Fecha: 2026-11-01
-- Descripcion:
--   1. Datos de Pago Movil, Zelle y efectivo por conductor.
--   2. RPC para que cada conductor guarde solo sus propios datos.
--   3. get_conductores_red expone los datos al cliente de su circulo,
--      para que pueda copiarlos al momento de pagar.
-- =============================================

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS pago_movil_activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS pago_movil_banco TEXT;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS pago_movil_cedula TEXT;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS pago_movil_telefono TEXT;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS zelle_activo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS zelle_email TEXT;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS zelle_nombre TEXT;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS efectivo_activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS metodos_pago_actualizado_at TIMESTAMPTZ;

-- =============================================
-- El conductor actualiza unicamente sus datos de cobro.
-- =============================================
CREATE OR REPLACE FUNCTION public.actualizar_metodos_pago_conductor(
    p_pago_movil_activo BOOLEAN,
    p_pago_movil_banco TEXT DEFAULT NULL,
    p_pago_movil_cedula TEXT DEFAULT NULL,
    p_pago_movil_telefono TEXT DEFAULT NULL,
    p_zelle_activo BOOLEAN DEFAULT FALSE,
    p_zelle_email TEXT DEFAULT NULL,
    p_zelle_nombre TEXT DEFAULT NULL,
    p_efectivo_activo BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant UUID := public.tenant_id();
    v_banco TEXT := NULLIF(trim(COALESCE(p_pago_movil_banco, '')), '');
    v_cedula TEXT := NULLIF(trim(COALESCE(p_pago_movil_cedula, '')), '');
    v_telefono TEXT := NULLIF(trim(COALESCE(p_pago_movil_telefono, '')), '');
    v_zelle_email TEXT := NULLIF(trim(COALESCE(p_zelle_email, '')), '');
    v_zelle_nombre TEXT := NULLIF(trim(COALESCE(p_zelle_nombre, '')), '');
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    IF COALESCE(p_pago_movil_activo, FALSE)
       AND (v_banco IS NULL OR v_cedula IS NULL OR v_telefono IS NULL) THEN
        RAISE EXCEPTION 'pago_movil_incompleto';
    END IF;

    IF COALESCE(p_zelle_activo, FALSE)
       AND (v_zelle_email IS NULL OR v_zelle_nombre IS NULL) THEN
        RAISE EXCEPTION 'zelle_incompleto';
    END IF;

    UPDATE public.tenants
    SET pago_movil_activo = COALESCE(p_pago_movil_activo, FALSE),
        pago_movil_banco = v_banco,
        pago_movil_cedula = v_cedula,
        pago_movil_telefono = v_telefono,
        zelle_activo = COALESCE(p_zelle_activo, FALSE),
        zelle_email = v_zelle_email,
        zelle_nombre = v_zelle_nombre,
        efectivo_activo = COALESCE(p_efectivo_activo, TRUE),
        metodos_pago_actualizado_at = NOW(),
        updated_at = NOW()
    WHERE id = v_tenant;

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_metodos_pago_conductor(
    BOOLEAN, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_metodos_pago_conductor(
    BOOLEAN, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN
) TO authenticated;

-- =============================================
-- Conductores del circulo del cliente con sus datos de cobro.
-- =============================================
DROP FUNCTION IF EXISTS public.get_conductores_red();

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
    total_resenas bigint,
    pausado boolean,
    suscripcion_activa boolean,
    disponibilidad text,
    disponibilidad_nota text,
    disponibilidad_hasta timestamptz,
    apodo text,
    favorito boolean,
    agregado_at timestamptz,
    pago_movil_activo boolean,
    pago_movil_banco text,
    pago_movil_cedula text,
    pago_movil_telefono text,
    zelle_activo boolean,
    zelle_email text,
    zelle_nombre text,
    efectivo_activo boolean
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
           (
               SELECT COUNT(*)
               FROM public.carreras c
               WHERE c.tenant_id = t.id
                 AND c.calificacion IS NOT NULL
           ) AS total_resenas,
           t.pausado,
           t.suscripcion_activa,
           t.disponibilidad,
           t.disponibilidad_nota,
           t.disponibilidad_hasta,
           rc.apodo,
           rc.favorito,
           rc.agregado_at,
           t.pago_movil_activo,
           t.pago_movil_banco,
           t.pago_movil_cedula,
           t.pago_movil_telefono,
           t.zelle_activo,
           t.zelle_email,
           t.zelle_nombre,
           t.efectivo_activo
    FROM public.red_cliente rc
    JOIN public.tenants t ON t.id = rc.conductor_tenant_id
    WHERE rc.cliente_id = auth.uid()
    ORDER BY rc.favorito DESC, rc.agregado_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_conductores_red() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conductores_red() TO authenticated;
