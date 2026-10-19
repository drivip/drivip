-- =============================================
-- MODULO: RLS (Row Level Security)
-- Fuente: seguridad.md, database/migrations/2026-09-17_tenant_saaS_fields.sql
-- Fecha: 2026-09-18
-- =============================================

-- =============================================
-- FUNCION HELPER: public.tenant_id()
-- Fuente: seguridad.md
-- Nota: se define en el esquema public porque el rol postgres
--       no tiene permiso CREATE sobre el esquema auth de Supabase.
-- =============================================
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
$$;

-- =============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins_activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE red_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TENANTS
-- Fuente: seguridad.md
-- =============================================
CREATE POLICY "tenant_select_own"
ON tenants FOR SELECT
USING (id = public.tenant_id());

-- =============================================
-- PROFILES
-- Cada usuario ve solo su propio perfil
-- =============================================
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- =============================================
-- CARRERAS
-- Fuente: seguridad.md — aislamiento total por tenant
-- =============================================
CREATE POLICY "carreras_tenant_isolation"
ON carreras FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- UBICACIONES
-- Solo el conductor dueño puede insertar/ver sus ubicaciones
-- Los clientes ven ubicaciones de conductores en su red
-- =============================================
CREATE POLICY "ubicaciones_conductor_isolation"
ON ubicaciones FOR ALL
USING (conductor_id = public.tenant_id())
WITH CHECK (conductor_id = public.tenant_id());

-- =============================================
-- CLIENTES
-- Un tenant solo ve los clientes registrados en su cuenta
-- =============================================
CREATE POLICY "clientes_tenant_isolation"
ON clientes FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- PLUGINS_ACTIVOS
-- Un tenant solo ve sus propios plugins
-- =============================================
CREATE POLICY "plugins_tenant_isolation"
ON plugins_activos FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- RED_CLIENTE
-- Un cliente solo ve sus propios contactos
-- =============================================
CREATE POLICY "red_cliente_user_isolation"
ON red_cliente FOR ALL
USING (cliente_id = auth.uid())
WITH CHECK (cliente_id = auth.uid());

-- =============================================
-- SUSCRIPCIONES
-- Un tenant solo ve sus propias suscripciones
-- =============================================
CREATE POLICY "suscripciones_tenant_isolation"
ON suscripciones FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- TENANT_BANNERS
-- Fuente: database/migrations/2026-09-17_tenant_saaS_fields.sql
-- =============================================
CREATE POLICY "tenant_banners_tenant_isolation"
ON tenant_banners FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- TENANT_NOTIFICACIONES
-- Fuente: database/migrations/2026-09-17_tenant_saaS_fields.sql
-- =============================================
CREATE POLICY "tenant_notif_tenant_isolation"
ON tenant_notificaciones FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());

-- =============================================
-- AUDIT_LOG
-- Solo lectura para el tenant dueño
-- =============================================
CREATE POLICY "audit_log_tenant_isolation"
ON audit_log FOR ALL
USING (tenant_id = public.tenant_id())
WITH CHECK (tenant_id = public.tenant_id());
