-- =============================================
-- Aliados y referidos del conductor
-- =============================================

-- ---------------------------------------------
-- 1. Código de referido por tenant
-- ---------------------------------------------
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS codigo_referido text;

CREATE OR REPLACE FUNCTION public.generar_codigo_referido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.codigo_referido IS NULL OR NEW.codigo_referido = '' THEN
        NEW.codigo_referido := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tenants_codigo_referido ON tenants;
CREATE TRIGGER trg_tenants_codigo_referido
    BEFORE INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION public.generar_codigo_referido();

UPDATE tenants
SET codigo_referido = upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE codigo_referido IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_codigo_referido
    ON tenants (upper(codigo_referido));

-- ---------------------------------------------
-- 2. Aliados
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS aliados (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.tenant_id() REFERENCES tenants(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    tipo text NOT NULL DEFAULT 'otro'
        CHECK (tipo IN ('tienda', 'restaurante', 'hotel', 'oficina', 'otro')),
    direccion text,
    telefono text,
    email text,
    carreras integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aliados_tenant ON aliados (tenant_id, created_at DESC);

ALTER TABLE aliados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aliados_tenant_isolation ON aliados;
CREATE POLICY aliados_tenant_isolation ON aliados
    FOR ALL
    USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());

-- ---------------------------------------------
-- 3. Referidos
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS referidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referidor_tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    referido_tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    codigo text NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activo')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referidos_referidor ON referidos (referidor_tenant_id, created_at DESC);

ALTER TABLE referidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referidos_select ON referidos;
CREATE POLICY referidos_select ON referidos
    FOR SELECT
    USING (referidor_tenant_id = public.tenant_id() OR referido_tenant_id = public.tenant_id());

-- El registro se hace solo por RPC para validar el código.
CREATE OR REPLACE FUNCTION public.registrar_referido(p_codigo text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referidor uuid;
    v_referido uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'no_autenticado';
    END IF;

    SELECT tenant_id INTO v_referido FROM profiles WHERE id = auth.uid();
    IF v_referido IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id INTO v_referidor
    FROM tenants
    WHERE upper(codigo_referido) = upper(trim(p_codigo))
    LIMIT 1;

    IF v_referidor IS NULL OR v_referidor = v_referido THEN
        RETURN NULL;
    END IF;

    INSERT INTO referidos (referidor_tenant_id, referido_tenant_id, codigo)
    VALUES (v_referidor, v_referido, upper(trim(p_codigo)))
    ON CONFLICT (referido_tenant_id) DO NOTHING;

    RETURN v_referidor;
END $$;

GRANT EXECUTE ON FUNCTION public.registrar_referido(text) TO authenticated;
