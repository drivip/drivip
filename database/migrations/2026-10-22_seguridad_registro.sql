-- =============================================
-- Endurecimiento del registro público
-- Fecha: 2026-10-22
-- Descripción:
--   Con mailer_autoconfirm = true, signUp devuelve sesión y las
--   escrituras de registro se hacen como usuario autenticado.
--   Se elimina el acceso anónimo para evitar que cualquiera con la
--   anon key cree tenants o perfiles arbitrarios.
-- =============================================

-- El perfil solo puede crearse para el propio usuario autenticado.
DROP POLICY IF EXISTS "profiles_insert_registro" ON profiles;
CREATE POLICY "profiles_insert_registro"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
    AND rol IN ('conductor', 'cliente')
);

-- El tenant de registro siempre nace inactivo y sin pausa.
DROP POLICY IF EXISTS "tenants_insert_registro" ON tenants;
CREATE POLICY "tenants_insert_registro"
ON tenants FOR INSERT
TO authenticated
WITH CHECK (suscripcion_activa = FALSE AND pausado = FALSE);
