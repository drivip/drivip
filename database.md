
---

### 📄 Archivo 2: `database.md`

```markdown
# Base de Datos — Drivip

## Extensiones necesarias

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
blas completas
1. tenants — Conductores
sql

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('conductor')),
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    logo_url TEXT,
    color_primario TEXT DEFAULT '#6B21A8',
    color_secundario TEXT DEFAULT '#FF7733',
    suscripcion_activa BOOLEAN DEFAULT FALSE,
    plan TEXT DEFAULT 'basico',
    fecha_vencimiento TIMESTAMPTZ,
    wayu_merchant_id TEXT,
    vehiculo_tipo TEXT,
    vehiculo_placa TEXT,
    vehiculo_modelo TEXT,
    vehiculo_color TEXT,
    ciudad TEXT,
    direccion TEXT,
    calificacion DECIMAL(3,2),
    total_clientes INTEGER DEFAULT 0,
    total_carreras INTEGER DEFAULT 0,
    pausado BOOLEAN DEFAULT FALSE,
    pausado_motivo TEXT,
    modulos_activos TEXT[] DEFAULT ARRAY['dashboard','carreras','pagos','perfil','qr','config'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_tipo ON tenants(tipo);

2. profiles — Perfiles de usuario
sql

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rol TEXT NOT NULL CHECK (rol IN ('maestro', 'conductor', 'cliente')),
    nombre TEXT,
    telefono TEXT,
    avatar_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_rol ON profiles(rol);

3. red_cliente — Red de conductores del cliente (NUEVA — CLAVE DEL MODELO)

Relaciona a un cliente con los conductores que ha agregado a su red vía QR.
sql

CREATE TABLE red_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    conductor_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    apodo TEXT, -- "José el de la moto", "Pedro el taxi"
    favorito BOOLEAN DEFAULT FALSE,
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    agregado_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cliente_id, conductor_tenant_id)
);

CREATE INDEX idx_red_cliente_cliente ON red_cliente(cliente_id);
CREATE INDEX idx_red_cliente_tenant ON red_cliente(conductor_tenant_id);

4. carreras — Viajes solicitados
sql

CREATE TABLE carreras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    conductor_id UUID REFERENCES profiles(id),
    cliente_id UUID REFERENCES profiles(id),
    origen_lat DECIMAL(10, 8) NOT NULL,
    origen_lng DECIMAL(11, 8) NOT NULL,
    origen_direccion TEXT,
    destino_lat DECIMAL(10, 8),
    destino_lng DECIMAL(11, 8),
    destino_direccion TEXT,
    distancia_km DECIMAL(10, 2),
    duracion_min INTEGER,
    precio DECIMAL(10, 2),
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'pago_movil', 'transferencia')),
    comprobante_url TEXT,
    tipo_servicio TEXT NOT NULL DEFAULT 'viaje' CHECK (tipo_servicio IN ('viaje', 'delivery', 'compra')),
    detalle_servicio TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'en_curso', 'completada', 'cancelada')),
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    comentario_calificacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    aceptada_at TIMESTAMPTZ,
    llego_at TIMESTAMPTZ,
    completada_at TIMESTAMPTZ,
    cancelada_at TIMESTAMPTZ
);

CREATE INDEX idx_carreras_tenant ON carreras(tenant_id);
CREATE INDEX idx_carreras_conductor ON carreras(conductor_id);
CREATE INDEX idx_carreras_cliente ON carreras(cliente_id);
CREATE INDEX idx_carreras_estado ON carreras(estado);
CREATE INDEX idx_carreras_tipo_servicio ON carreras(tipo_servicio);
CREATE INDEX idx_carreras_fecha ON carreras(created_at DESC);

5. ubicaciones — Seguimiento en tiempo real
sql

CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conductor_id UUID REFERENCES profiles(id) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    carrera_id UUID REFERENCES carreras(id),
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    velocidad DECIMAL(5, 2),
    direccion DECIMAL(5, 2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ubicaciones_conductor ON ubicaciones(conductor_id, timestamp DESC);
CREATE INDEX idx_ubicaciones_carrera ON ubicaciones(carrera_id, timestamp DESC);

6. clientes — Base de clientes del conductor
sql

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    profile_id UUID REFERENCES profiles(id),
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    total_carreras INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

7. plugins_activos — Plugins premium por tenant
sql

CREATE TABLE plugins_activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    plugin_nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    configuracion JSONB DEFAULT '{}',
    activado_at TIMESTAMPTZ DEFAULT NOW(),
    desactivado_at TIMESTAMPTZ,
    UNIQUE(tenant_id, plugin_nombre)
);

CREATE INDEX idx_plugins_tenant ON plugins_activos(tenant_id);

8. zonas — Cobro por zona (Plugin Premium)
sql

CREATE TABLE zonas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    nombre TEXT NOT NULL,
    poligono JSONB NOT NULL,
    precio_base DECIMAL(10, 2),
    precio_km DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

9. suscripciones — Historial de pagos
sql

CREATE TABLE suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    moneda TEXT DEFAULT 'USD',
    metodo_pago TEXT CHECK (metodo_pago IN ('pago_movil', 'transferencia', 'efectivo', 'wayu')),
    referencia TEXT,
    comprobante_url TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificado', 'rechazado')),
    verificado_por UUID REFERENCES profiles(id),
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suscripciones_tenant ON suscripciones(tenant_id, created_at DESC);

10. audit_log — Auditoría
sql

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    usuario_id UUID,
    accion TEXT NOT NULL,
    tabla TEXT,
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id, created_at DESC);

11. tenant_banners — Banners individuales por tenant
sql

CREATE TABLE tenant_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('alta', 'normal', 'baja')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_banners_tenant ON tenant_banners(tenant_id);

12. tenant_notificaciones — Notificaciones individuales por tenant
sql

CREATE TABLE tenant_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'promocion', 'alerta', 'sistema')),
    enviada BOOLEAN DEFAULT FALSE,
    enviada_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_notif_tenant ON tenant_notificaciones(tenant_id, created_at DESC);

Políticas RLS completas
sql

-- ============ TENANTS ============
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_own"
ON tenants FOR SELECT
USING (id = auth.tenant_id());

CREATE POLICY "tenant_update_own"
ON tenants FOR UPDATE
USING (id = auth.tenant_id())
WITH CHECK (id = auth.tenant_id());

-- Permitir que clientes vean info básica de tenants de su red
CREATE POLICY "tenant_select_red_cliente"
ON tenants FOR SELECT
USING (
    id IN (
        SELECT conductor_tenant_id FROM red_cliente
        WHERE cliente_id = auth.uid()
    )
);

-- ============ PROFILES ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_tenant"
ON profiles FOR SELECT
USING (tenant_id = auth.tenant_id() OR id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============ RED_CLIENTE ============
ALTER TABLE red_cliente ENABLE ROW LEVEL SECURITY;

-- El cliente solo ve y gestiona su propia red
CREATE POLICY "red_cliente_own"
ON red_cliente FOR ALL
USING (cliente_id = auth.uid())
WITH CHECK (cliente_id = auth.uid());

-- El conductor puede ver quién lo ha agregado a su red
CREATE POLICY "red_cliente_conductor_view"
ON red_cliente FOR SELECT
USING (conductor_tenant_id = auth.tenant_id());

-- ============ CARRERAS ============
ALTER TABLE carreras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carreras_tenant_isolation"
ON carreras FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- El cliente ve sus propias carreras
CREATE POLICY "carreras_cliente_own"
ON carreras FOR SELECT
USING (cliente_id = auth.uid());

-- El cliente puede insertar carreras a conductores de su red
CREATE POLICY "carreras_cliente_insert_red"
ON carreras FOR INSERT
WITH CHECK (
    cliente_id = auth.uid()
    AND tenant_id IN (
        SELECT conductor_tenant_id FROM red_cliente
        WHERE cliente_id = auth.uid()
    )
);

-- ============ UBICACIONES ============
ALTER TABLE ubicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ubicaciones_tenant_isolation"
ON ubicaciones FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- El cliente ve ubicaciones solo de conductores de su red Y con carrera activa
CREATE POLICY "ubicaciones_cliente_red"
ON ubicaciones FOR SELECT
USING (
    tenant_id IN (
        SELECT conductor_tenant_id FROM red_cliente
        WHERE cliente_id = auth.uid()
    )
    AND carrera_id IN (
        SELECT id FROM carreras
        WHERE cliente_id = auth.uid()
        AND estado IN ('aceptada', 'en_curso')
    )
);

-- ============ CLIENTES ============
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_tenant_isolation"
ON clientes FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- ============ PLUGINS ============
ALTER TABLE plugins_activos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plugins_tenant_isolation"
ON plugins_activos FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- ============ ZONAS ============
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zonas_tenant_isolation"
ON zonas FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- ============ SUSCRIPCIONES ============
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suscripciones_tenant_isolation"
ON suscripciones FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- ============ AUDIT LOG ============
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_tenant_isolation"
ON audit_log FOR SELECT
USING (tenant_id = auth.tenant_id());

-- ============ TENANT BANNERS ============
ALTER TABLE tenant_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_banners_tenant_isolation"
ON tenant_banners FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

-- ============ TENANT NOTIFICACIONES ============
ALTER TABLE tenant_notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_notif_tenant_isolation"
ON tenant_notificaciones FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

Funciones y triggers
Trigger updated_at
sql

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

Trigger de auditoría
sql

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        tenant_id, usuario_id, accion, tabla, registro_id,
        datos_anteriores, datos_nuevos
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_carreras
    AFTER INSERT OR UPDATE OR DELETE ON carreras
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

Función Haversine
sql

CREATE OR REPLACE FUNCTION calcular_distancia(
    lat1 DECIMAL, lng1 DECIMAL,
    lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371;
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    a := SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2)^2;
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

Función para agregar conductor a red del cliente
sql

CREATE OR REPLACE FUNCTION agregar_conductor_a_red(
    p_slug TEXT,
    p_apodo TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_cliente_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- Buscar tenant por slug
    SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_slug AND suscripcion_activa = TRUE;

    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'Conductor no encontrado o inactivo');
    END IF;

    -- Insertar o actualizar
    INSERT INTO red_cliente (cliente_id, conductor_tenant_id, apodo)
    VALUES (v_cliente_id, v_tenant_id, p_apodo)
    ON CONFLICT (cliente_id, conductor_tenant_id)
    DO UPDATE SET apodo = COALESCE(p_apodo, red_cliente.apodo)
    RETURNING to_jsonb(red_cliente.*) INTO v_result;

    RETURN jsonb_build_object('ok', TRUE, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

Realtime
sql

ALTER PUBLICATION supabase_realtime ADD TABLE carreras;
ALTER PUBLICATION supabase_realtime ADD TABLE ubicaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE red_cliente;

Storage
sql

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', FALSE);

CREATE POLICY "comprobantes_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'comprobantes'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "comprobantes_select_own"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'comprobantes'
    AND (owner = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'rol' = 'maestro')
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', TRUE);