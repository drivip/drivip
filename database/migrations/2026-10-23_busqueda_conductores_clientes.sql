-- =============================================
-- Migracion: busqueda de conductores y clientes reales
-- Fecha: 2026-10-23
-- Descripcion:
--   1. Guarda el email en profiles para que el superadmin pueda
--      listar clientes registrados aunque todavia no tengan conductor.
--   2. Repara el perfil de conductores que ya existian en tenants
--      pero no tenian fila en profiles (causaba que su QR apuntara
--      al slug "conductor" y mostrara "conductor no existe").
--   3. Permite buscar conductores por nombre/slug sin exponer datos
--      privados y agregarlos a la red desde la app cliente.
--   4. Sincroniza clientes por conductor al agregar un contacto.
-- =============================================

-- 1. Email en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 2. Reparar perfiles de conductores existentes
INSERT INTO public.profiles (id, tenant_id, rol, nombre, email, telefono, activo)
SELECT DISTINCT ON (u.id)
       u.id,
       t.id,
       'conductor',
       COALESCE(NULLIF(trim(t.nombre), ''), u.email),
       u.email,
       t.telefono,
       TRUE
FROM auth.users u
JOIN public.tenants t
  ON lower(trim(t.email)) = lower(trim(u.email))
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ORDER BY u.id, t.created_at ASC
ON CONFLICT (id) DO UPDATE
SET tenant_id = COALESCE(public.profiles.tenant_id, EXCLUDED.tenant_id),
    email = COALESCE(public.profiles.email, EXCLUDED.email);

-- 3. Evitar duplicados en la red y en clientes por conductor
CREATE UNIQUE INDEX IF NOT EXISTS ux_red_cliente_cliente_conductor
  ON public.red_cliente(cliente_id, conductor_tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_clientes_tenant_profile
  ON public.clientes(tenant_id, profile_id)
  WHERE profile_id IS NOT NULL;

-- 4. Busqueda publica tolerante a mayusculas/espacios
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(p_slug text)
RETURNS TABLE (
    id uuid,
    slug text,
    nombre text,
    type text,
    logo_url text,
    ciudad text,
    vehiculo_tipo text,
    vehiculo_placa text,
    vehiculo_modelo text,
    vehiculo_color text,
    calificacion numeric,
    pausado boolean,
    suscripcion_activa boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT t.id,
           t.slug,
           t.nombre,
           t.type,
           t.logo_url,
           t.ciudad,
           t.vehiculo_tipo,
           t.vehiculo_placa,
           t.vehiculo_modelo,
           t.vehiculo_color,
           t.calificacion,
           t.pausado,
           t.suscripcion_activa
    FROM public.tenants t
    WHERE lower(trim(t.slug)) = lower(trim(p_slug))
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;

-- 5. Directorio publico para buscar conductores por nombre o slug
CREATE OR REPLACE FUNCTION public.buscar_conductores(p_query text)
RETURNS TABLE (
    id uuid,
    slug text,
    nombre text,
    type text,
    logo_url text,
    ciudad text,
    vehiculo_tipo text,
    vehiculo_placa text,
    vehiculo_modelo text,
    vehiculo_color text,
    calificacion numeric,
    pausado boolean,
    suscripcion_activa boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT t.id,
           t.slug,
           t.nombre,
           t.type,
           t.logo_url,
           t.ciudad,
           t.vehiculo_tipo,
           t.vehiculo_placa,
           t.vehiculo_modelo,
           t.vehiculo_color,
           t.calificacion,
           t.pausado,
           t.suscripcion_activa
    FROM public.tenants t
    WHERE t.type = 'conductor'
      AND (
        COALESCE(trim(p_query), '') = ''
        OR t.nombre ILIKE '%' || trim(p_query) || '%'
        OR t.slug ILIKE '%' || trim(p_query) || '%'
      )
    ORDER BY
      CASE WHEN lower(t.nombre) = lower(trim(p_query)) THEN 0 ELSE 1 END,
      t.nombre ASC
    LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_conductores(text) TO authenticated;

-- 6. Agregar conductor a la red y registrar el cliente en su tenant
CREATE OR REPLACE FUNCTION public.agregar_conductor_red(
    p_slug text,
    p_apodo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_tenant public.tenants%ROWTYPE;
    v_profile public.profiles%ROWTYPE;
    v_red_id uuid;
    v_nombre text;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    SELECT *
    INTO v_tenant
    FROM public.tenants
    WHERE lower(trim(slug)) = lower(trim(p_slug))
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'conductor_no_encontrado';
    END IF;

    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE id = v_uid;

    v_nombre := NULLIF(trim(concat_ws(' ', v_profile.nombre, v_profile.apellido)), '');
    IF v_nombre IS NULL THEN
        v_nombre := COALESCE(
            NULLIF(trim(v_profile.email), ''),
            NULLIF(split_part(COALESCE(auth.jwt() ->> 'email', ''), '@', 1), ''),
            'Cliente'
        );
    END IF;

    INSERT INTO public.red_cliente (
        cliente_id,
        conductor_tenant_id,
        apodo,
        favorito,
        notificaciones_activas
    )
    VALUES (
        v_uid,
        v_tenant.id,
        NULLIF(trim(p_apodo), ''),
        FALSE,
        TRUE
    )
    ON CONFLICT (cliente_id, conductor_tenant_id) DO UPDATE
    SET apodo = COALESCE(NULLIF(trim(EXCLUDED.apodo), ''), public.red_cliente.apodo)
    RETURNING id INTO v_red_id;

    INSERT INTO public.clientes (
        tenant_id,
        profile_id,
        nombre,
        telefono,
        email,
        total_carreras
    )
    VALUES (
        v_tenant.id,
        v_uid,
        v_nombre,
        v_profile.telefono,
        v_profile.email,
        0
    )
    ON CONFLICT (tenant_id, profile_id) WHERE profile_id IS NOT NULL DO UPDATE
    SET nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        email = EXCLUDED.email;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'red_id', v_red_id,
        'tenant_id', v_tenant.id,
        'slug', v_tenant.slug,
        'nombre', v_tenant.nombre,
        'pausado', v_tenant.pausado,
        'suscripcion_activa', v_tenant.suscripcion_activa
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.agregar_conductor_red(text, text) TO authenticated;

-- 7. Sincronizar clientes aunque el contacto se agregue por otra via
CREATE OR REPLACE FUNCTION public.sync_cliente_desde_red()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre text;
BEGIN
    SELECT COALESCE(
             NULLIF(trim(concat_ws(' ', p.nombre, p.apellido)), ''),
             NULLIF(trim(p.email), ''),
             'Cliente'
           )
    INTO v_nombre
    FROM public.profiles p
    WHERE p.id = NEW.cliente_id;

    INSERT INTO public.clientes (
        tenant_id,
        profile_id,
        nombre,
        telefono,
        email,
        total_carreras
    )
    SELECT NEW.conductor_tenant_id,
           p.id,
           COALESCE(v_nombre, 'Cliente'),
           p.telefono,
           p.email,
           0
    FROM public.profiles p
    WHERE p.id = NEW.cliente_id
    ON CONFLICT (tenant_id, profile_id) WHERE profile_id IS NOT NULL DO UPDATE
    SET nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_red_cliente_sync_cliente ON public.red_cliente;
CREATE TRIGGER trg_red_cliente_sync_cliente
AFTER INSERT ON public.red_cliente
FOR EACH ROW
EXECUTE FUNCTION public.sync_cliente_desde_red();

-- 8. Rellenar clientes para redes existentes
INSERT INTO public.clientes (
    tenant_id,
    profile_id,
    nombre,
    telefono,
    email,
    total_carreras
)
SELECT DISTINCT ON (rc.conductor_tenant_id, p.id)
       rc.conductor_tenant_id,
       p.id,
       COALESCE(NULLIF(trim(concat_ws(' ', p.nombre, p.apellido)), ''), NULLIF(trim(p.email), ''), 'Cliente'),
       p.telefono,
       p.email,
       0
FROM public.red_cliente rc
JOIN public.profiles p ON p.id = rc.cliente_id
ORDER BY rc.conductor_tenant_id, p.id
ON CONFLICT (tenant_id, profile_id) WHERE profile_id IS NOT NULL DO NOTHING;
