-- =============================================
-- Migracion: vincular la cuenta de Auth con su tenant
-- Fecha: 2026-10-21
-- Descripcion:
--   El panel del conductor resolvia el tenant usando la parte
--   local del email (useTenant(email.split("@")[0])), pero el
--   slug generado en el registro incluye un sufijo aleatorio,
--   por lo que la consulta nunca encontraba el tenant y la UI
--   mostraba los datos de ejemplo (MOCK_DRIVER_PROFILE).
--
--   La relacion correcta ya existe en profiles.tenant_id. Esta
--   migracion:
--     1. Rellena profiles.tenant_id para los registros previos.
--     2. Hace que public.tenant_id() use ese vinculo cuando el
--        JWT no trae app_metadata.tenant_id, para que las
--        policies de carreras, ubicaciones, etc. funcionen.
-- =============================================

-- =============================================
-- 1. Backfill: conductores ya registrados.
--    Se empareja auth.users.email con tenants.email y se toma
--    el tenant mas reciente del conductor.
-- =============================================
UPDATE public.profiles p
SET tenant_id = t.id
FROM auth.users u
CROSS JOIN LATERAL (
    SELECT id
    FROM public.tenants
    WHERE lower(email) = lower(u.email)
      AND type = 'conductor'
    ORDER BY created_at DESC
    LIMIT 1
) t
WHERE p.id = u.id
  AND p.rol = 'conductor'
  AND p.tenant_id IS NULL;

-- El registro antiguo guardaba solo el nombre (sin apellido) en
-- tenants.nombre. Se completa el nombre completo cuando el tenant
-- aun conserva exactamente ese nombre de pila.
UPDATE public.tenants t
SET nombre = trim(p.nombre || ' ' || p.apellido)
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE lower(t.email) = lower(u.email)
  AND t.type = 'conductor'
  AND p.rol = 'conductor'
  AND p.nombre IS NOT NULL
  AND p.apellido IS NOT NULL
  AND t.nombre = p.nombre;

-- =============================================
-- 2. tenant_id(): usar el perfil como respaldo.
--    El JWT actual no incluye app_metadata.tenant_id, por lo
--    que todas las policies basadas en tenant_id() bloqueaban
--    al conductor autenticado.
-- =============================================
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::UUID,
        (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public.tenant_id() TO authenticated;
