-- Fase 4: aprobacion/rechazo de suscripcion en una sola transaccion.
-- Devuelve el tenant_id para que el panel envie el push correspondiente.

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
            'No pudimos verificar tu pago. Revisa el comprobante y vuelve a enviarlo.',
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
