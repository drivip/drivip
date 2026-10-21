-- =============================================
-- Reseñas reales de conductores (panel cliente)
-- 1. get_conductores_red expone el total de reseñas.
-- 2. get_resenas_conductor devuelve las reseñas reales
--    (calificación, comentario, fecha y nombre del cliente).
-- Ejecutar en Supabase (SQL Editor) o con `supabase db push`.
-- =============================================

DROP FUNCTION IF EXISTS public.get_conductores_red();

CREATE OR REPLACE FUNCTION public.get_conductores_red()
RETURNS TABLE (
    conductor_tenant_id uuid,
    slug text,
    nombre text,
    logo_url text,
    ciudad text,
    telefono text,
    vehiculo_tipo text,
    vehiculo_placa text,
    vehiculo_modelo text,
    vehiculo_color text,
    calificacion numeric,
    total_resenas bigint,
    pausado boolean,
    suscripcion_activa boolean,
    apodo text,
    favorito boolean,
    agregado_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT t.id,
           t.slug,
           t.nombre,
           t.logo_url,
           t.ciudad,
           t.telefono,
           t.vehiculo_tipo,
           t.vehiculo_placa,
           t.vehiculo_modelo,
           t.vehiculo_color,
           t.calificacion,
           (
               SELECT COUNT(*)
               FROM public.carreras c
               WHERE c.tenant_id = t.id
                 AND c.calificacion IS NOT NULL
           ) AS total_resenas,
           t.pausado,
           t.suscripcion_activa,
           rc.apodo,
           rc.favorito,
           rc.agregado_at
    FROM public.red_cliente rc
    JOIN public.tenants t ON t.id = rc.conductor_tenant_id
    WHERE rc.cliente_id = auth.uid()
    ORDER BY rc.favorito DESC, rc.agregado_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_conductores_red() TO authenticated;

-- =============================================
-- Reseñas públicas de un conductor.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_resenas_conductor(p_tenant_id uuid)
RETURNS TABLE (
    calificacion double precision,
    comentario text,
    fecha timestamptz,
    cliente text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT c.calificacion,
           NULLIF(trim(c.comentario_calificacion), '') AS comentario,
           COALESCE(c.completada_at, c.aceptada_at, c.created_at) AS fecha,
           CASE
               WHEN p.nombre IS NULL OR trim(p.nombre) = '' THEN 'Cliente'
               ELSE split_part(trim(p.nombre), ' ', 1)
           END AS cliente
    FROM public.carreras c
    LEFT JOIN public.profiles p ON p.id = c.cliente_id
    WHERE c.tenant_id = p_tenant_id
      AND c.calificacion IS NOT NULL
    ORDER BY fecha DESC
    LIMIT 30;
$$;

GRANT EXECUTE ON FUNCTION public.get_resenas_conductor(uuid) TO authenticated;
