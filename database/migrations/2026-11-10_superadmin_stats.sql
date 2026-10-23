-- Drivip - metricas exactas del panel superadmin sin descargar tablas completas.
-- Aplicar con: supabase db query --linked -f database/migrations/2026-11-10_superadmin_stats.sql

CREATE OR REPLACE FUNCTION public.get_superadmin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today timestamptz := date_trunc('day', now());
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    RETURN jsonb_build_object(
        'total_tenants', (SELECT count(*) FROM public.tenants),
        'active_tenants', (
            SELECT count(*) FROM public.tenants WHERE suscripcion_activa
        ),
        'total_clients', (
            SELECT count(*) FROM public.profiles WHERE rol = 'cliente'
        ),
        'mrr', COALESCE((
            SELECT sum(s.monto)
            FROM public.suscripciones s
            JOIN public.tenants t ON t.id = s.tenant_id
            WHERE t.suscripcion_activa
              AND s.estado = 'verificado'
              AND s.id = (
                  SELECT s2.id
                  FROM public.suscripciones s2
                  WHERE s2.tenant_id = s.tenant_id
                    AND s2.estado = 'verificado'
                  ORDER BY s2.created_at DESC
                  LIMIT 1
              )
        ), 0),
        'rides_today', (
            SELECT count(*) FROM public.carreras WHERE created_at >= v_today
        ),
        'completed_today', (
            SELECT count(*)
            FROM public.carreras
            WHERE created_at >= v_today AND estado = 'completada'
        )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_superadmin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_superadmin_stats() TO authenticated;
