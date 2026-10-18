-- Migracion: Campos de registro
-- Fecha: 2026-09-18
-- Descripcion: Agrega campos apellido y cedula para formularios de registro

-- 1. Campo apellido en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apellido TEXT;

-- 2. Campo cedula en tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cedula TEXT;
