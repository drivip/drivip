-- =============================================
-- Migracion: busqueda publica de conductor por slug
-- Fecha: 2026-10-20
-- Descripcion:
--   El QR / enlace personal del conductor apunta a
--   drivip-cliente.pages.dev/?add=<slug>. La app cliente
--   necesita mostrar el conductor al que se va a agregar,
--   pero la policy tenant_select_own solo permite leer el
--   tenant propio (id = tenant_id()).
--
--   Esta migracion expone unicamente los campos publicos del
--   conductor mediante la funcion get_tenant_by_slug, que es
--   SECURITY DEFINER (ignora RLS) y puede ser invocada por
--   anon y authenticated. No se exponen email, telefono ni
--   cedula.
-- =============================================

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
    WHERE t.slug = p_slug
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;
