-- =============================================
-- Migracion: permisos de escritura del superadmin sobre tenants
-- Fecha: 2026-10-20
-- Descripcion:
--   La tabla tenants solo tenia:
--     - tenant_select_own (SELECT propio)
--     - tenants_insert_registro (INSERT publico en registro)
--     - tenants_superadmin_read (SELECT para superadmin)
--
--   No existia ninguna policy de UPDATE (ni INSERT/DELETE) para
--   el superadmin, por lo que activar un conductor, cambiar plan,
--   pausar o actualizar el vehiculo no tenia efecto (Postgres/RLS
--   filtraba las filas y el UPDATE afectaba 0 registros).
--
--   Esta migracion agrega una policy FOR ALL para el superadmin.
--   Las demas policies siguen activas y PostgreSQL las evalua con OR.
-- =============================================

DROP POLICY IF EXISTS "tenants_superadmin_write" ON tenants;
CREATE POLICY "tenants_superadmin_write"
ON tenants FOR ALL
USING (public.is_superadmin() = TRUE)
WITH CHECK (public.is_superadmin() = TRUE);
