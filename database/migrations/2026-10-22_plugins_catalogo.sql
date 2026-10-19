-- =============================================
-- Catálogo global de plugins (panel superadmin)
-- =============================================
CREATE TABLE IF NOT EXISTS plugins_catalogo (
    id text PRIMARY KEY,
    nombre text NOT NULL,
    descripcion text,
    icono text NOT NULL DEFAULT 'extension',
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO plugins_catalogo (id, nombre, descripcion, icono) VALUES
    ('pedidos_programados', 'Pedidos Programados', 'Permite agendar carreras para una fecha y hora.', 'schedule'),
    ('pagos_moviles', 'Pagos Móviles', 'Cobro y validación de Pago Móvil con comprobante.', 'qr_code_2'),
    ('multi_destino', 'Multi Destino', 'Varias paradas en una misma carrera.', 'route'),
    ('aliados_b2b', 'Aliados B2B', 'Gestión de aliados y convenios comerciales.', 'storefront'),
    ('notificaciones_push', 'Notificaciones Push', 'Avisos en tiempo real al conductor y al cliente.', 'notifications')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE plugins_catalogo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plugins_catalogo_read ON plugins_catalogo;
CREATE POLICY plugins_catalogo_read ON plugins_catalogo
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS plugins_catalogo_superadmin_all ON plugins_catalogo;
CREATE POLICY plugins_catalogo_superadmin_all ON plugins_catalogo
    FOR ALL
    USING (public.is_superadmin() = TRUE)
    WITH CHECK (public.is_superadmin() = TRUE);
