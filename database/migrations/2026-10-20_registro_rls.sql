-- =============================================
-- Migracion: RLS para registro publico (conductor / cliente)
-- Fecha: 2026-10-20
-- Descripcion:
--   Al registrarse, el frontend crea la cuenta de Auth y
--   luego escribe en public.tenants (conductor) o en
--   public.profiles (conductor y cliente).
--
--   Con la confirmacion de email ACTIVA (mailer_autoconfirm = false)
--   el signUp devuelve al usuario pero SIN sesion, por lo que
--   auth.uid() es NULL y las policies existentes lo bloquean:
--     - tenants  no tenia policy de INSERT  -> error de registro.
--     - profiles_insert_own requiere auth.uid() -> error de registro.
--
--   Esta migracion agrega las policies necesarias para el
--   registro. El tenant se crea INACTIVO y queda pendiente de
--   aprobacion del superadmin (la app lo inserta con
--   suscripcion_activa = false).
-- =============================================

-- =============================================
-- 1. TENANTS: permitir INSERT durante el registro.
--    El conductor solo puede crear tenants inactivos y sin pausar;
--    la activacion/pausa queda reservada al superadmin.
-- =============================================
DROP POLICY IF EXISTS "tenants_insert_registro" ON tenants;
CREATE POLICY "tenants_insert_registro"
ON tenants FOR INSERT
TO anon, authenticated
WITH CHECK (suscripcion_activa = FALSE AND pausado = FALSE);

-- =============================================
-- 2. PROFILES: permitir INSERT durante el registro.
--    Se limita a los roles publicos (conductor / cliente) para
--    que un registro anonimo no pueda crear perfiles
--    'maestro' ni 'comercio'. La FK a auth.users(id) garantiza
--    que el perfil pertenece a un usuario real de Auth.
-- =============================================
DROP POLICY IF EXISTS "profiles_insert_registro" ON profiles;
CREATE POLICY "profiles_insert_registro"
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (rol IN ('conductor', 'cliente'));
