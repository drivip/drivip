-- =============================================
-- Pedidos B2B (panel superadmin)
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos_b2b (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa text NOT NULL,
    destino text NOT NULL,
    conductor text,
    estado text NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'asignada', 'en_curso', 'completada', 'cancelada')),
    monto numeric(10, 2),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_b2b_created ON pedidos_b2b (created_at DESC);

ALTER TABLE pedidos_b2b ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pedidos_b2b_superadmin_all ON pedidos_b2b;
CREATE POLICY pedidos_b2b_superadmin_all ON pedidos_b2b
    FOR ALL
    USING (public.is_superadmin() = TRUE)
    WITH CHECK (public.is_superadmin() = TRUE);
