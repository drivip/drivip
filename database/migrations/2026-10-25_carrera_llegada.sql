-- =============================================
-- Migracion: marca de llegada del conductor al punto de recogida
-- Fecha: 2026-10-25
-- Descripcion:
--   Permite que el conductor marque "Ya llegue" y que el cliente
--   reciba el aviso en tiempo real sin cerrar el seguimiento del viaje.
-- =============================================

ALTER TABLE public.carreras
    ADD COLUMN IF NOT EXISTS llego_at timestamptz;

COMMENT ON COLUMN public.carreras.llego_at IS
    'Momento en que el conductor marco que llego al punto de recogida.';

CREATE INDEX IF NOT EXISTS idx_carreras_llego_at
    ON public.carreras(llego_at) WHERE llego_at IS NOT NULL;
