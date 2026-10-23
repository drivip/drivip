-- Aplicar DESPUES de desplegar la PWA que usa reportar_ubicacion.
-- Cierra las escrituras directas del conductor sobre el historial GPS.

DROP POLICY IF EXISTS "ubicaciones_conductor_isolation" ON public.ubicaciones;
DROP POLICY IF EXISTS "ubicaciones_conductor_select" ON public.ubicaciones;
CREATE POLICY "ubicaciones_conductor_select"
ON public.ubicaciones FOR SELECT
TO authenticated
USING (conductor_id = public.tenant_id());
