-- =============================================
-- Comercio: productos y pedidos
-- =============================================

-- ---------------------------------------------
-- 0. Permitir tenants de tipo comercio
-- ---------------------------------------------
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_type_check
    CHECK (type IN ('conductor', 'comercio'));

-- Permitir que el registro público cree perfiles de comercio.
DROP POLICY IF EXISTS profiles_insert_registro ON profiles;
CREATE POLICY profiles_insert_registro
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (rol IN ('conductor', 'cliente', 'comercio'));

-- ---------------------------------------------
-- 1. PRODUCTOS
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    precio numeric(10, 2) NOT NULL DEFAULT 0,
    stock integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_tenant ON productos (tenant_id, created_at DESC);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS productos_tenant_isolation ON productos;
CREATE POLICY productos_tenant_isolation ON productos
    FOR ALL
    USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS productos_superadmin_all ON productos;
CREATE POLICY productos_superadmin_all ON productos
    FOR ALL
    USING (public.is_superadmin() = TRUE)
    WITH CHECK (public.is_superadmin() = TRUE);

-- ---------------------------------------------
-- 2. PEDIDOS DEL COMERCIO
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos_comercio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_nombre text NOT NULL,
    telefono text,
    direccion_entrega text,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    total numeric(10, 2) NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_comercio_tenant ON pedidos_comercio (tenant_id, created_at DESC);

ALTER TABLE pedidos_comercio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pedidos_comercio_tenant_isolation ON pedidos_comercio;
CREATE POLICY pedidos_comercio_tenant_isolation ON pedidos_comercio
    FOR ALL
    USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS pedidos_comercio_superadmin_all ON pedidos_comercio;
CREATE POLICY pedidos_comercio_superadmin_all ON pedidos_comercio
    FOR ALL
    USING (public.is_superadmin() = TRUE)
    WITH CHECK (public.is_superadmin() = TRUE);
