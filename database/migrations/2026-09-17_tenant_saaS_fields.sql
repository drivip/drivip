-- =============================================
-- Migracion: Panel SaaS de Gestion de Tenants
-- Fecha: 2026-09-17
-- Descripcion: Agrega campos de vehiculo, pausa, modulos, metricas
--              y tablas de banners/notificaciones individuales por tenant
-- =============================================

-- 1. Nuevas columnas en la tabla tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS vehiculo_tipo TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS vehiculo_placa TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS vehiculo_modelo TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS vehiculo_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calificacion DECIMAL(3,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_clientes INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_carreras INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pausado BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pausado_motivo TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS modulos_activos TEXT[] DEFAULT ARRAY['dashboard','carreras','pagos','perfil','qr','config'];

-- 2. Tabla de banners individuales por tenant
CREATE TABLE IF NOT EXISTS tenant_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('alta', 'normal', 'baja')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_banners_tenant ON tenant_banners(tenant_id);

-- 3. Tabla de notificaciones individuales por tenant
CREATE TABLE IF NOT EXISTS tenant_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'promocion', 'alerta', 'sistema')),
    enviada BOOLEAN DEFAULT FALSE,
    enviada_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_notif_tenant ON tenant_notificaciones(tenant_id, created_at DESC);

-- 4. RLS Policies para las nuevas tablas
ALTER TABLE tenant_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_banners_tenant_isolation" ON tenant_banners;
CREATE POLICY "tenant_banners_tenant_isolation"
ON tenant_banners FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

ALTER TABLE tenant_notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_notif_tenant_isolation" ON tenant_notificaciones;
CREATE POLICY "tenant_notif_tenant_isolation"
ON tenant_notificaciones FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- 5. Migrar datos existentes (opcional)
-- Si ya tienes conductores con datos de vehiculo en otra tabla, copiarlos aqui:
-- UPDATE tenants SET
--   vehiculo_tipo = LOWER(otra_tabla.tipo_vehiculo),
--   vehiculo_placa = otra_tabla.placa,
--   vehiculo_modelo = otra_tabla.modelo,
--   vehiculo_color = otra_tabla.color
-- FROM otra_tabla WHERE tenants.id = otra_tabla.tenant_id;
