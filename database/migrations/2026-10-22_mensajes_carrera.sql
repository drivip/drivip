-- =============================================
-- Migracion: mensajes entre cliente y conductor por carrera
-- Fecha: 2026-10-22
-- Descripcion:
--   Canal de chat ligado a una carrera. Solo los dos participantes
--   (cliente y conductor dueno del tenant) pueden leer y escribir.
--   El marcado de "leido" se hace por RPC para no exponer un UPDATE
--   que permita alterar el contenido de los mensajes.
-- =============================================

CREATE TABLE IF NOT EXISTS public.mensajes_carrera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrera_id UUID NOT NULL REFERENCES public.carreras(id) ON DELETE CASCADE,
    emisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emisor_rol TEXT NOT NULL CHECK (emisor_rol IN ('cliente', 'conductor')),
    contenido TEXT NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 1000),
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_carrera ON public.mensajes_carrera(carrera_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mensajes_carrera_no_leidos
    ON public.mensajes_carrera(carrera_id, leido) WHERE leido = FALSE;

ALTER TABLE public.mensajes_carrera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensajes_carrera_select_participantes" ON public.mensajes_carrera;
CREATE POLICY "mensajes_carrera_select_participantes"
ON public.mensajes_carrera FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.carreras c
        WHERE c.id = mensajes_carrera.carrera_id
          AND (c.cliente_id = auth.uid() OR c.tenant_id = public.tenant_id())
    )
);

DROP POLICY IF EXISTS "mensajes_carrera_insert_participantes" ON public.mensajes_carrera;
CREATE POLICY "mensajes_carrera_insert_participantes"
ON public.mensajes_carrera FOR INSERT
TO authenticated
WITH CHECK (
    emisor_id = auth.uid()
    AND (
        (
            emisor_rol = 'cliente'
            AND EXISTS (
                SELECT 1 FROM public.carreras c
                WHERE c.id = mensajes_carrera.carrera_id
                  AND c.cliente_id = auth.uid()
            )
        )
        OR
        (
            emisor_rol = 'conductor'
            AND EXISTS (
                SELECT 1 FROM public.carreras c
                WHERE c.id = mensajes_carrera.carrera_id
                  AND c.tenant_id = public.tenant_id()
            )
        )
    )
);

-- Marca como leidos los mensajes recibidos por el usuario autenticado.
CREATE OR REPLACE FUNCTION public.marcar_mensajes_leidos(p_carrera_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user uuid := auth.uid();
    v_count integer := 0;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.carreras c
        WHERE c.id = p_carrera_id
          AND (c.cliente_id = v_user OR c.tenant_id = public.tenant_id())
    ) THEN
        RETURN 0;
    END IF;

    UPDATE public.mensajes_carrera
    SET leido = TRUE
    WHERE carrera_id = p_carrera_id
      AND emisor_id <> v_user
      AND leido = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_mensajes_leidos(uuid) TO authenticated;
GRANT SELECT, INSERT ON public.mensajes_carrera TO authenticated;

-- Realtime: el otro participante recibe el mensaje sin recargar.
ALTER TABLE public.mensajes_carrera REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'mensajes_carrera'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_carrera;
    END IF;
END $$;
