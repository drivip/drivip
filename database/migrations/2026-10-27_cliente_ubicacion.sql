-- =============================================
-- Migracion: ubicacion del cliente
-- Fecha: 2026-10-27
-- Descripcion:
--   Guarda el estado y la ciudad seleccionados durante el registro
--   del cliente para que el conductor pueda ubicarlo.
-- =============================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS estado TEXT,
    ADD COLUMN IF NOT EXISTS ciudad TEXT;

COMMENT ON COLUMN public.profiles.estado IS
    'Estado de Venezuela seleccionado por el cliente.';

COMMENT ON COLUMN public.profiles.ciudad IS
    'Ciudad o localidad seleccionada por el cliente.';
