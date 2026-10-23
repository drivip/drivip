-- Fase 4: el conductor solo puede cambiar estado, llegada y cotizacion valida.
-- No puede alterar identidad, recorrido ni precio de un viaje ya aceptado.

CREATE OR REPLACE FUNCTION public.proteger_carrera_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Service role, SQL administrativo y superadmin no se restringen.
    IF auth.uid() IS NULL OR public.is_superadmin() THEN
        RETURN NEW;
    END IF;

    -- Solo aplica al conductor dueno de la carrera.
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.rol = 'conductor'
          AND p.tenant_id = OLD.tenant_id
    ) THEN
        RETURN NEW;
    END IF;

    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.conductor_id IS DISTINCT FROM OLD.conductor_id
       OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
       OR NEW.tipo_servicio IS DISTINCT FROM OLD.tipo_servicio
       OR NEW.origen_lat IS DISTINCT FROM OLD.origen_lat
       OR NEW.origen_lng IS DISTINCT FROM OLD.origen_lng
       OR NEW.destino_lat IS DISTINCT FROM OLD.destino_lat
       OR NEW.destino_lng IS DISTINCT FROM OLD.destino_lng
       OR NEW.distancia_km IS DISTINCT FROM OLD.distancia_km
       OR NEW.duracion_min IS DISTINCT FROM OLD.duracion_min THEN
        RAISE EXCEPTION 'carrera_campos_inmutables';
    END IF;

    IF NEW.calificacion IS DISTINCT FROM OLD.calificacion
       OR NEW.comentario_calificacion IS DISTINCT FROM OLD.comentario_calificacion THEN
        RAISE EXCEPTION 'calificacion_solo_cliente';
    END IF;

    -- Solo se cotiza una compra que aun no fue aceptada.
    IF NEW.precio IS DISTINCT FROM OLD.precio THEN
        IF OLD.tipo_servicio <> 'compra' OR OLD.estado <> 'pendiente' THEN
            RAISE EXCEPTION 'precio_no_editable';
        END IF;
        IF NEW.precio IS NULL OR NEW.precio <= 0 THEN
            RAISE EXCEPTION 'precio_invalido';
        END IF;
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (
            (OLD.estado = 'pendiente' AND NEW.estado IN ('aceptada', 'cancelada'))
            OR (OLD.estado = 'aceptada' AND NEW.estado IN ('en_curso', 'cancelada'))
            OR (OLD.estado = 'en_curso' AND NEW.estado = 'completada')
        ) THEN
            RAISE EXCEPTION 'transicion_invalida';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carreras_proteger_update ON public.carreras;
CREATE TRIGGER trg_carreras_proteger_update
BEFORE UPDATE ON public.carreras
FOR EACH ROW EXECUTE FUNCTION public.proteger_carrera_update();

REVOKE ALL ON FUNCTION public.proteger_carrera_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.proteger_carrera_update() FROM anon, authenticated;

-- Endurecer funciones internas que quedaron con grants por defecto.
REVOKE ALL ON FUNCTION public.es_ultima_ubicacion(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.calificar_carrera(uuid, double precision, text) FROM anon;
REVOKE ALL ON FUNCTION public.preparar_carrera_insert() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.proteger_campos_perfil() FROM anon, authenticated;
