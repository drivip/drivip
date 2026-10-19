-- =============================================
-- Migracion: Notificaciones Push (Web Push / VAPID)
-- Fecha: 2026-10-19
-- Descripcion: Suscripciones de navegador para Web Push.
--              Cada fila = un dispositivo/navegador suscrito por usuario.
-- =============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_tenant ON push_subscriptions(tenant_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuario administra unicamente sus propias suscripciones
DROP POLICY IF EXISTS "push_subs_select_own" ON push_subscriptions;
CREATE POLICY "push_subs_select_own"
ON push_subscriptions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subs_insert_own" ON push_subscriptions;
CREATE POLICY "push_subs_insert_own"
ON push_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subs_update_own" ON push_subscriptions;
CREATE POLICY "push_subs_update_own"
ON push_subscriptions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subs_delete_own" ON push_subscriptions;
CREATE POLICY "push_subs_delete_own"
ON push_subscriptions FOR DELETE
USING (user_id = auth.uid());

-- El superadmin puede gestionar todas las suscripciones (soporte)
DROP POLICY IF EXISTS "push_subs_superadmin_all" ON push_subscriptions;
CREATE POLICY "push_subs_superadmin_all"
ON push_subscriptions FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());
