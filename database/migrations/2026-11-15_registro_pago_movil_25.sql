-- Flujo de registro de conductores: pago movil unico de 25 USD.
-- Guarda el banco desde el que pago el conductor y exige banco/referencia
-- antes de que el superadmin pueda aprobar la suscripcion.

ALTER TABLE public.suscripciones
    ADD COLUMN IF NOT EXISTS banco_origen text;

UPDATE public.config_referidos
SET precio_plan_estandar = 25,
    precio_plan_profesional = 25,
    precio_plan_premium = 25,
    actualizado_at = now()
WHERE id = 1;

CREATE OR REPLACE FUNCTION public.verificar_suscripcion(
    p_id uuid,
    p_aprobado boolean,
    p_verificado_por text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub public.suscripciones%ROWTYPE;
    v_fin timestamptz;
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    SELECT * INTO v_sub
    FROM public.suscripciones
    WHERE id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'suscripcion_no_encontrada';
    END IF;

    IF p_aprobado AND (
        v_sub.referencia IS NULL
        OR btrim(v_sub.referencia) = ''
        OR v_sub.banco_origen IS NULL
        OR btrim(v_sub.banco_origen) = ''
    ) THEN
        RAISE EXCEPTION 'datos_pago_incompletos';
    END IF;

    IF p_aprobado THEN
        v_fin := now() + interval '30 days';

        UPDATE public.suscripciones
        SET estado = 'verificado',
            verificado_por = p_verificado_por,
            fecha_inicio = now(),
            fecha_fin = v_fin
        WHERE id = p_id;

        UPDATE public.tenants
        SET suscripcion_activa = true,
            fecha_vencimiento = v_fin,
            updated_at = now()
        WHERE id = v_sub.tenant_id;

        INSERT INTO public.tenant_notificaciones (
            tenant_id, titulo, mensaje, tipo, enviada, enviada_at
        ) VALUES (
            v_sub.tenant_id,
            'Suscripcion aprobada',
            'Tu cuenta ya esta activa. Ya puedes recibir solicitudes de tus clientes.',
            'sistema',
            true,
            now()
        );
    ELSE
        UPDATE public.suscripciones
        SET estado = 'rechazado',
            verificado_por = p_verificado_por
        WHERE id = p_id;

        INSERT INTO public.tenant_notificaciones (
            tenant_id, titulo, mensaje, tipo, enviada, enviada_at
        ) VALUES (
            v_sub.tenant_id,
            'Suscripcion rechazada',
            'No pudimos verificar tu pago. Revisa los datos y vuelve a enviarlos.',
            'alerta',
            true,
            now()
        );
    END IF;

    RETURN v_sub.tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.verificar_suscripcion(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verificar_suscripcion(uuid, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verificar_suscripcion(uuid, boolean, text) TO authenticated;

ALTER TABLE public.suscripciones REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'suscripciones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.suscripciones;
    END IF;
END $$;
