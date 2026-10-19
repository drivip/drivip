-- =============================================
-- Direcciones guardadas y reservas del cliente
-- =============================================

-- ---------------------------------------------
-- 1. DIRECCIONES DEL CLIENTE
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS direcciones_cliente (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    alias text NOT NULL,
    direccion text NOT NULL,
    referencia text,
    lat double precision,
    lng double precision,
    icono text NOT NULL DEFAULT 'home',
    predeterminada boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direcciones_cliente ON direcciones_cliente (cliente_id, created_at DESC);

ALTER TABLE direcciones_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS direcciones_cliente_all ON direcciones_cliente;
CREATE POLICY direcciones_cliente_all ON direcciones_cliente
    FOR ALL
    TO authenticated
    USING (cliente_id = auth.uid())
    WITH CHECK (cliente_id = auth.uid());

-- ---------------------------------------------
-- 2. RESERVAS DEL CLIENTE
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
    conductor_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
    origen text NOT NULL,
    destino text NOT NULL,
    origen_lat double precision,
    origen_lng double precision,
    destino_lat double precision,
    destino_lng double precision,
    fecha_hora timestamptz NOT NULL,
    notas text,
    precio_usd numeric(10, 2),
    estado text NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas (cliente_id, fecha_hora DESC);

ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservas_cliente_all ON reservas;
CREATE POLICY reservas_cliente_all ON reservas
    FOR ALL
    TO authenticated
    USING (cliente_id = auth.uid())
    WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS reservas_conductor_read ON reservas;
CREATE POLICY reservas_conductor_read ON reservas
    FOR SELECT
    TO authenticated
    USING (conductor_tenant_id = public.tenant_id());
