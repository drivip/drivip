-- =============================================
-- Migracion: tarifas configurables del conductor
-- Fecha: 2026-10-21
-- Descripcion:
--   El conductor define si cobra por kilometro (base + $/km) o por
--   zona (precio fijo por zona). La app del cliente calcula y muestra
--   el precio automaticamente segun la configuracion del conductor.
--
--   - Columnas de tarifa en tenants.
--   - Tabla zonas (precio fijo por zona del conductor).
--   - RPC actualizar_tarifas_propias: el conductor solo actualiza sus
--     propias tarifas (sin poder tocar plan/pausa/suscripcion).
--   - RPC publica get_tarifas_tenant: la app del cliente lee la tarifa
--     y las zonas de un conductor por su tenant_id.
-- =============================================

-- =============================================
-- 1. Columnas de tarifa en tenants
-- =============================================
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS tarifa_modo TEXT NOT NULL DEFAULT 'km'
        CHECK (tarifa_modo IN ('km', 'zona'));
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS tarifa_base NUMERIC(10,2) NOT NULL DEFAULT 2.00;
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS tarifa_por_km NUMERIC(10,2) NOT NULL DEFAULT 0.50;

-- =============================================
-- 2. Tabla zonas (precio fijo por zona)
-- =============================================
CREATE TABLE IF NOT EXISTS zonas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    precio NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zonas_tenant ON zonas(tenant_id);

ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zonas_tenant_isolation" ON zonas;
CREATE POLICY "zonas_tenant_isolation"
ON zonas FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- 3. actualizar_tarifas_propias: el conductor solo
--    modifica sus propias tarifas.
-- =============================================
CREATE OR REPLACE FUNCTION public.actualizar_tarifas_propias(
    p_modo text,
    p_base numeric,
    p_por_km numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant UUID := public.tenant_id();
BEGIN
    IF v_tenant IS NULL THEN
        RETURN FALSE;
    END IF;

    IF p_modo NOT IN ('km', 'zona') THEN
        RAISE EXCEPTION 'Modo de tarifa invalido: %', p_modo;
    END IF;

    UPDATE tenants
    SET tarifa_modo = p_modo,
        tarifa_base = GREATEST(COALESCE(p_base, 0), 0),
        tarifa_por_km = GREATEST(COALESCE(p_por_km, 0), 0)
    WHERE id = v_tenant;

    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_tarifas_propias(text, numeric, numeric) TO authenticated;

-- =============================================
-- 4. get_tarifas_tenant: lectura publica de la
--    tarifa de un conductor (sin datos privados).
-- =============================================
CREATE OR REPLACE FUNCTION public.get_tarifas_tenant(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'tenant_id', t.id,
        'nombre', t.nombre,
        'modo', t.tarifa_modo,
        'base', t.tarifa_base,
        'por_km', t.tarifa_por_km,
        'zonas', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', z.id,
                'tenant_id', z.tenant_id,
                'nombre', z.nombre,
                'precio', z.precio,
                'created_at', z.created_at
            ) ORDER BY z.created_at)
            FROM zonas z
            WHERE z.tenant_id = t.id
        ), '[]'::jsonb)
    )
    FROM tenants t
    WHERE t.id = p_tenant_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_tarifas_tenant(uuid) TO anon, authenticated;
