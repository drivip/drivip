-- =============================================
-- Configuracion administrativa del programa de referidos
-- =============================================
-- Permite al superadmin ajustar porcentajes y precios sin acceso
-- directo de escritura a la tabla config_referidos.

CREATE OR REPLACE FUNCTION public.actualizar_config_referidos(
    p_descuento_por_referido_pct numeric,
    p_meta_referidos_gratis integer,
    p_comision_socio_pct numeric,
    p_precio_plan_estandar numeric,
    p_precio_plan_profesional numeric,
    p_precio_plan_premium numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_config public.config_referidos%ROWTYPE;
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    IF p_descuento_por_referido_pct IS NULL
       OR p_descuento_por_referido_pct < 0
       OR p_descuento_por_referido_pct > 100 THEN
        RAISE EXCEPTION 'descuento_invalido';
    END IF;

    IF p_meta_referidos_gratis IS NULL
       OR p_meta_referidos_gratis < 1
       OR p_meta_referidos_gratis > 1000 THEN
        RAISE EXCEPTION 'meta_invalida';
    END IF;

    IF p_comision_socio_pct IS NULL
       OR p_comision_socio_pct < 0
       OR p_comision_socio_pct > 100 THEN
        RAISE EXCEPTION 'comision_invalida';
    END IF;

    IF p_precio_plan_estandar IS NULL
       OR p_precio_plan_estandar < 0
       OR p_precio_plan_profesional IS NULL
       OR p_precio_plan_profesional < 0
       OR p_precio_plan_premium IS NULL
       OR p_precio_plan_premium < 0 THEN
        RAISE EXCEPTION 'precio_invalido';
    END IF;

    UPDATE public.config_referidos
       SET descuento_por_referido_pct = p_descuento_por_referido_pct,
           meta_referidos_gratis = p_meta_referidos_gratis,
           comision_socio_pct = p_comision_socio_pct,
           precio_plan_estandar = p_precio_plan_estandar,
           precio_plan_profesional = p_precio_plan_profesional,
           precio_plan_premium = p_precio_plan_premium,
           actualizado_at = now()
     WHERE id = 1
     RETURNING * INTO v_config;

    RETURN to_jsonb(v_config);
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_config_referidos(numeric, integer, numeric, numeric, numeric, numeric)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actualizar_config_referidos(numeric, integer, numeric, numeric, numeric, numeric)
    TO authenticated;

-- Lectura para el panel; escritura solo por la RPC anterior.
REVOKE ALL ON public.config_referidos FROM anon, authenticated;
GRANT SELECT ON public.config_referidos TO authenticated;
