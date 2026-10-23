-- Cierra el EXECUTE implicito de PUBLIC/anon en las funciones de negocio.
-- Las unicas RPC publicas son el perfil por slug y la tasa de cambio.

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS firma
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND p.proname NOT IN (
              'get_tenant_by_slug',
              'get_tasa_actual',
              'custom_access_token_hook'
          )
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.firma);
    END LOOP;
END;
$$;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS firma
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND p.proname NOT IN ('custom_access_token_hook')
          AND NOT EXISTS (
              SELECT 1
              FROM pg_trigger t
              WHERE t.tgfoid = p.oid
                AND NOT t.tgisinternal
          )
    LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.firma);
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tasa_actual(text) TO anon, authenticated;
