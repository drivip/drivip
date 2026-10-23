-- Drivip - publicar reservas en Realtime para que el conductor
-- reciba nuevas reservas y cambios de estado sin recargar.
-- Aplicar con: supabase db query --linked -f database/migrations/2026-11-09_reservas_realtime.sql

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'reservas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;
    END IF;
END $$;

ALTER TABLE public.reservas REPLICA IDENTITY FULL;
