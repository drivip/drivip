-- =============================================
-- SCHEMA BASE: Drivip
-- Fecha: 2026-09-18
-- Descripcion: CREATE TABLE de todas las tablas del proyecto
--              Basado en types TypeScript y operaciones Supabase del frontend
-- Nota: Estas tablas DEBEN crearse ANTES de las migraciones
-- =============================================

-- =============================================
-- 1. TENANTS (conductores / lineas)
-- Fuente: packages/types/src/tenant.ts
-- Migraciones: 2026-09-17 (campos vehiculo/pausa/modulos), 2026-09-18 (cedula)
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'conductor' CHECK (type IN ('conductor')),
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    logo_url TEXT,
    color_primario TEXT NOT NULL DEFAULT '#7c3aed',
    color_secundario TEXT NOT NULL DEFAULT '#4f46e5',
    suscripcion_activa BOOLEAN NOT NULL DEFAULT FALSE,
    plan TEXT NOT NULL DEFAULT 'estandar',
    fecha_vencimiento TIMESTAMPTZ,
    cedula TEXT,
    ciudad TEXT,
    direccion TEXT,
    vehiculo_tipo TEXT CHECK (vehiculo_tipo IN ('moto', 'carro', 'camioneta')),
    vehiculo_placa TEXT,
    vehiculo_modelo TEXT,
    vehiculo_color TEXT,
    calificacion DECIMAL(3,2),
    total_clientes INTEGER NOT NULL DEFAULT 0,
    total_carreras INTEGER NOT NULL DEFAULT 0,
    pausado BOOLEAN NOT NULL DEFAULT FALSE,
    pausado_motivo TEXT,
    modulos_activos TEXT[] NOT NULL DEFAULT ARRAY['dashboard','carreras','pagos','perfil','qr','config'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- =============================================
-- 2. PROFILES (perfiles de usuario)
-- Fuente: packages/types/src/profile.ts
-- Migracion: 2026-09-18 (campo apellido)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('maestro', 'conductor', 'cliente')),
    nombre TEXT,
    apellido TEXT,
    telefono TEXT,
    email TEXT,
    estado TEXT,
    ciudad TEXT,
    avatar_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);

-- =============================================
-- 3. CARRERAS (viajes)
-- Fuente: packages/types/src/carrera.ts
-- =============================================
CREATE TYPE carrera_estado AS ENUM ('pendiente', 'aceptada', 'en_curso', 'completada', 'cancelada');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'pago_movil', 'transferencia');

CREATE TABLE IF NOT EXISTS carreras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conductor_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    origen_lat DOUBLE PRECISION NOT NULL,
    origen_lng DOUBLE PRECISION NOT NULL,
    origen_direccion TEXT,
    destino_lat DOUBLE PRECISION,
    destino_lng DOUBLE PRECISION,
    destino_direccion TEXT,
    distancia_km DOUBLE PRECISION,
    duracion_min DOUBLE PRECISION,
    precio DOUBLE PRECISION,
    metodo_pago metodo_pago,
    comprobante_url TEXT,
    tipo_servicio TEXT NOT NULL DEFAULT 'viaje' CHECK (tipo_servicio IN ('viaje', 'delivery', 'compra')),
    detalle_servicio TEXT,
    estado carrera_estado NOT NULL DEFAULT 'pendiente',
    calificacion DOUBLE PRECISION,
    comentario_calificacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aceptada_at TIMESTAMPTZ,
    llego_at TIMESTAMPTZ,
    completada_at TIMESTAMPTZ,
    cancelada_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_carreras_tenant ON carreras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carreras_conductor ON carreras(conductor_id);
CREATE INDEX IF NOT EXISTS idx_carreras_cliente ON carreras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_carreras_estado ON carreras(estado);
CREATE INDEX IF NOT EXISTS idx_carreras_tipo_servicio ON carreras(tipo_servicio);

-- =============================================
-- 4. UBICACIONES (posiciones GPS)
-- Fuente: packages/types/src/ubicacion.ts
-- =============================================
CREATE TABLE IF NOT EXISTS ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conductor_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    carrera_id UUID REFERENCES carreras(id) ON DELETE SET NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    velocidad DOUBLE PRECISION,
    direccion DOUBLE PRECISION,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_conductor ON ubicaciones(conductor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_carrera ON ubicaciones(carrera_id);

-- =============================================
-- 5. RED_CLIENTE (circulo de conductores del cliente)
-- Fuente: packages/types/src/cliente.ts (RedCliente)
-- =============================================
CREATE TABLE IF NOT EXISTS red_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conductor_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    apodo TEXT,
    favorito BOOLEAN NOT NULL DEFAULT FALSE,
    notificaciones_activas BOOLEAN NOT NULL DEFAULT TRUE,
    agregado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_red_cliente_user ON red_cliente(cliente_id);

-- =============================================
-- 6. CLIENTES (registros de cliente por tenant)
-- Fuente: packages/types/src/cliente.ts (Cliente)
-- Referenciado en RLS de seguridad.md
-- =============================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    total_carreras INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);

-- =============================================
-- 7. PLUGINS_ACTIVOS (plugins habilitados por tenant)
-- Fuente: packages/types/src/plugin.ts
-- =============================================
CREATE TABLE IF NOT EXISTS plugins_activos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plugin_nombre TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    configuracion JSONB NOT NULL DEFAULT '{}',
    activado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    desactivado_at TIMESTAMPTZ,
    UNIQUE (tenant_id, plugin_nombre)
);

CREATE INDEX IF NOT EXISTS idx_plugins_tenant ON plugins_activos(tenant_id);

-- =============================================
-- 8. SUSCRIPCIONES (pagos de suscripcion)
-- Fuente: packages/types/src/suscripcion.ts
-- =============================================
CREATE TYPE suscripcion_estado AS ENUM ('pendiente', 'verificado', 'rechazado');
CREATE TYPE metodo_pago_suscripcion AS ENUM ('pago_movil', 'transferencia', 'efectivo');

CREATE TABLE IF NOT EXISTS suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'VES',
    metodo_pago metodo_pago_suscripcion NOT NULL,
    referencia TEXT,
    comprobante_url TEXT,
    estado suscripcion_estado NOT NULL DEFAULT 'pendiente',
    verificado_por TEXT,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_tenant ON suscripciones(tenant_id);

-- =============================================
-- 9. TENANT_BANNERS (banners por tenant)
-- Fuente: packages/types/src/tenantBanner.ts
-- Migracion: 2026-09-17
-- =============================================
CREATE TYPE banner_prioridad AS ENUM ('alta', 'normal', 'baja');

CREATE TABLE IF NOT EXISTS tenant_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    prioridad banner_prioridad NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_banners_tenant ON tenant_banners(tenant_id);

-- =============================================
-- 10. TENANT_NOTIFICACIONES (notificaciones por tenant)
-- Fuente: packages/types/src/tenantNotificacion.ts
-- Migracion: 2026-09-17
-- =============================================
CREATE TYPE notificacion_tipo AS ENUM ('info', 'promocion', 'alerta', 'sistema');

CREATE TABLE IF NOT EXISTS tenant_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo notificacion_tipo NOT NULL DEFAULT 'info',
    enviada BOOLEAN NOT NULL DEFAULT FALSE,
    enviada_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_notif_tenant ON tenant_notificaciones(tenant_id, created_at DESC);

-- =============================================
-- 11. AUDIT_LOG (registro de auditoria)
-- Fuente: seguridad.md
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    usuario_id UUID,
    accion TEXT NOT NULL,
    tabla TEXT,
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id);
