-- =============================================
-- Migracion: edicion del perfil del conductor
-- Fecha: 2026-11-16
-- Descripcion:
--   1. RPC para que el conductor autenticado actualice solo los
--      campos publicos de su propio tenant (nombre, contacto,
--      direccion y vehiculo). No se exponen columnas sensibles
--      como plan, suscripcion_activa o pausado.
--   2. Bucket publico "perfiles" para guardar la foto del conductor
--      ya comprimida en WebP desde el cliente.
--   3. Policies de Storage para que cada conductor escriba solo
--      dentro de la carpeta de su propio tenant.
-- =============================================

CREATE OR REPLACE FUNCTION public.actualizar_perfil_conductor(
    p_nombre TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_ciudad TEXT DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL,
    p_vehiculo_tipo TEXT DEFAULT NULL,
    p_vehiculo_placa TEXT DEFAULT NULL,
    p_vehiculo_modelo TEXT DEFAULT NULL,
    p_vehiculo_color TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL
)
RETURNS public.tenants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant UUID := public.tenant_id();
    v_nombre TEXT := NULLIF(trim(COALESCE(p_nombre, '')), '');
    v_tipo TEXT := NULLIF(trim(COALESCE(p_vehiculo_tipo, '')), '');
    v_logo TEXT := NULLIF(trim(COALESCE(p_logo_url, '')), '');
    v_result public.tenants;
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF v_nombre IS NULL THEN
        RAISE EXCEPTION 'nombre_requerido';
    END IF;

    IF v_tipo IS NOT NULL AND v_tipo NOT IN ('moto', 'carro', 'camioneta') THEN
        RAISE EXCEPTION 'vehiculo_tipo_invalido';
    END IF;

    UPDATE public.tenants
    SET nombre = v_nombre,
        telefono = NULLIF(trim(COALESCE(p_telefono, '')), ''),
        ciudad = NULLIF(trim(COALESCE(p_ciudad, '')), ''),
        direccion = NULLIF(trim(COALESCE(p_direccion, '')), ''),
        vehiculo_tipo = v_tipo,
        vehiculo_placa = UPPER(NULLIF(trim(COALESCE(p_vehiculo_placa, '')), '')),
        vehiculo_modelo = NULLIF(trim(COALESCE(p_vehiculo_modelo, '')), ''),
        vehiculo_color = NULLIF(trim(COALESCE(p_vehiculo_color, '')), ''),
        logo_url = COALESCE(v_logo, logo_url),
        updated_at = NOW()
    WHERE id = v_tenant
    RETURNING * INTO v_result;

    IF v_result.id IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    UPDATE public.profiles
    SET telefono = NULLIF(trim(COALESCE(p_telefono, '')), ''),
        avatar_url = COALESCE(v_logo, avatar_url),
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_perfil_conductor(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_perfil_conductor(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

-- ---------------------------------------------
-- Bucket de imagenes de perfil
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'perfiles',
    'perfiles',
    TRUE,
    5242880,
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "perfiles_select_public" ON storage.objects;
CREATE POLICY "perfiles_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'perfiles');

DROP POLICY IF EXISTS "perfiles_insert_own" ON storage.objects;
CREATE POLICY "perfiles_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'perfiles'
    AND (storage.foldername(name))[1] = public.tenant_id()::text
);

DROP POLICY IF EXISTS "perfiles_update_own" ON storage.objects;
CREATE POLICY "perfiles_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'perfiles'
    AND (storage.foldername(name))[1] = public.tenant_id()::text
)
WITH CHECK (
    bucket_id = 'perfiles'
    AND (storage.foldername(name))[1] = public.tenant_id()::text
);

DROP POLICY IF EXISTS "perfiles_delete_own" ON storage.objects;
CREATE POLICY "perfiles_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'perfiles'
    AND (storage.foldername(name))[1] = public.tenant_id()::text
);
