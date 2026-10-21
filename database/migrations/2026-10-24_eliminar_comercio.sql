-- =============================================
-- Eliminacion definitiva del panel y datos de comercio
-- Fecha: 2026-10-24
-- =============================================

-- 1. Eliminar pedidos, productos y comercios.
DROP TABLE IF EXISTS public.pedidos_comercio;
DROP TABLE IF EXISTS public.productos;
DROP TABLE IF EXISTS public.comercios CASCADE;

-- 2. Conservar usuarios de comercio como clientes y eliminar sus tenants.
UPDATE public.profiles
SET rol = 'cliente'
WHERE rol = 'comercio';

DELETE FROM public.tenants
WHERE type = 'comercio';

-- 3. Restringir los tipos y roles del sistema.
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_type_check
    CHECK (type IN ('conductor'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check
    CHECK (rol IN ('maestro', 'conductor', 'cliente'));

-- 4. Permitir el registro publico solo para conductores y clientes.
DROP POLICY IF EXISTS "profiles_insert_registro" ON public.profiles;
CREATE POLICY "profiles_insert_registro"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
    AND rol IN ('conductor', 'cliente')
);
