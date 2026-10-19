-- =============================================
-- Recálculo de métricas por tenant (superadmin)
-- =============================================
CREATE OR REPLACE FUNCTION public.recalcular_metricas_tenants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'solo_superadmin';
    END IF;

    UPDATE tenants t
    SET total_carreras = (
            SELECT count(*) FROM carreras c
            WHERE c.tenant_id = t.id AND c.estado = 'completada'
        ),
        total_clientes = (
            SELECT count(*) FROM clientes cl WHERE cl.tenant_id = t.id
        ),
        updated_at = now();
END $$;

GRANT EXECUTE ON FUNCTION public.recalcular_metricas_tenants() TO authenticated;
