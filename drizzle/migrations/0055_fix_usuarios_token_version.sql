-- Corrección: añadir token_version a usuarios para bases donde la migración 0030
-- ejecutó su sección DOWN (DROP COLUMN) tras el ADD COLUMN.
-- Esta migración es idempotente y segura para bases nuevas y existentes.
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "token_version" integer DEFAULT 0 NOT NULL;
