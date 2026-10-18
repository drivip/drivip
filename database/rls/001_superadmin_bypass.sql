-- =============================================
-- MODULO: RLS SUPERADMIN BYPASS
-- Fuente: apps/superadmin/ (modulo Clientes)
-- Fecha: 2026-09-21
-- Descripcion: Policies que permiten al superadmin
--              leer/escribir datos de TODOS los tenants
-- Nota: Las policies existentes de tenant_isolation
--       siguen activas. PostgreSQL evalúa con OR.
-- =============================================

-- =============================================
-- FUNCION: auth.is_superadmin()
-- Verifica si el usuario tiene role='superadmin'
-- en app_metadata del JWT de Supabase Auth
-- =============================================
CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'superadmin',
        FALSE
    );
$$;

-- =============================================
-- POLICY: clientes_superadmin_all
-- Superadmin puede ver/modificar clientes de cualquier tenant
-- Aplica a tabla: clientes
-- Operaciones: SELECT, INSERT, UPDATE, DELETE
-- =============================================
DROP POLICY IF EXISTS "clientes_superadmin_all" ON clientes;
CREATE POLICY "clientes_superadmin_all"
ON clientes FOR ALL
USING (auth.is_superadmin() = TRUE)
WITH CHECK (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: red_cliente_superadmin_all
-- Superadmin puede ver/modificar la red de cualquier cliente
-- Aplica a tabla: red_cliente
-- Operaciones: SELECT, INSERT, UPDATE, DELETE
-- =============================================
DROP POLICY IF EXISTS "red_cliente_superadmin_all" ON red_cliente;
CREATE POLICY "red_cliente_superadmin_all"
ON red_cliente FOR ALL
USING (auth.is_superadmin() = TRUE)
WITH CHECK (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: tenants_superadmin_read
-- Superadmin puede ver TODOS los tenants
-- Necesario para resolver nombres en useClientes
-- Aplica a tabla: tenants
-- Operaciones: SELECT
-- =============================================
DROP POLICY IF EXISTS "tenants_superadmin_read" ON tenants;
CREATE POLICY "tenants_superadmin_read"
ON tenants FOR SELECT
USING (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: suscripciones_superadmin_all
-- Superadmin puede ver/verificar todas las suscripciones
-- Aplica a tabla: suscripciones
-- Operaciones: SELECT, INSERT, UPDATE, DELETE
-- =============================================
DROP POLICY IF EXISTS "suscripciones_superadmin_all" ON suscripciones;
CREATE POLICY "suscripciones_superadmin_all"
ON suscripciones FOR ALL
USING (auth.is_superadmin() = TRUE)
WITH CHECK (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: carreras_superadmin_read
-- Superadmin puede ver carreras de cualquier tenant
-- Aplica a tabla: carreras
-- Operaciones: SELECT
-- =============================================
DROP POLICY IF EXISTS "carreras_superadmin_read" ON carreras;
CREATE POLICY "carreras_superadmin_read"
ON carreras FOR SELECT
USING (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: profiles_superadmin_read
-- Superadmin puede ver perfiles de cualquier usuario
-- Necesario para resolver info de clientes
-- Aplica a tabla: profiles
-- Operaciones: SELECT
-- =============================================
DROP POLICY IF EXISTS "profiles_superadmin_read" ON profiles;
CREATE POLICY "profiles_superadmin_read"
ON profiles FOR SELECT
USING (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: ubicaciones_superadmin_read
-- Superadmin puede ver ubicaciones de cualquier conductor
-- Aplica a tabla: ubicaciones
-- Operaciones: SELECT
-- =============================================
DROP POLICY IF EXISTS "ubicaciones_superadmin_read" ON ubicaciones;
CREATE POLICY "ubicaciones_superadmin_read"
ON ubicaciones FOR SELECT
USING (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: plugins_superadmin_all
-- Superadmin puede ver/modificar plugins de cualquier tenant
-- Aplica a tabla: plugins_activos
-- Operaciones: SELECT, INSERT, UPDATE, DELETE
-- =============================================
DROP POLICY IF EXISTS "plugins_superadmin_all" ON plugins_activos;
CREATE POLICY "plugins_superadmin_all"
ON plugins_activos FOR ALL
USING (auth.is_superadmin() = TRUE)
WITH CHECK (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: tenant_banners_superadmin_all
-- Superadmin puede gestionar banners de cualquier tenant
-- Aplica a tabla: tenant_banners
-- Operaciones: SELECT, INSERT, UPDATE, DELETE
-- =============================================
DROP POLICY IF EXISTS "tenant_banners_superadmin_all" ON tenant_banners;
CREATE POLICY "tenant_banners_superadmin_all"
ON tenant_banners FOR ALL
USING (auth.is_superadmin() = TRUE)
WITH CHECK (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: tenant_notif_superadmin_all
-- Superadmin puede gestionar notificaciones de cualquier tenant
-- Aplica a tabla: tenant_notificaciones
-- Operaciones: SELECT, INSERT, UPDATE, DELETE
-- =============================================
DROP POLICY IF EXISTS "tenant_notif_superadmin_all" ON tenant_notificaciones;
CREATE POLICY "tenant_notif_superadmin_all"
ON tenant_notificaciones FOR ALL
USING (auth.is_superadmin() = TRUE)
WITH CHECK (auth.is_superadmin() = TRUE);

-- =============================================
-- POLICY: audit_log_superadmin_read
-- Superadmin puede ver logs de auditoría de cualquier tenant
-- Aplica a tabla: audit_log
-- Operaciones: SELECT
-- =============================================
DROP POLICY IF EXISTS "audit_log_superadmin_read" ON audit_log;
CREATE POLICY "audit_log_superadmin_read"
ON audit_log FOR SELECT
USING (auth.is_superadmin() = TRUE);
