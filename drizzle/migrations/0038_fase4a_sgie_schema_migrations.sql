-- Migration 0038: SGIE schema migrations registry
--
-- Tabla propia para registrar migraciones aplicadas a la rama Neon aislada,
-- independiente de __drizzle_migrations (que no está reconciliada con el
-- journal histórico). Cada migración se identifica por nombre + hash SHA-256
-- del contenido; un hash cambiado aborta el aplicador.
--
-- Idempotente: CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "sgie_schema_migrations" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL UNIQUE,
  "hash" varchar(64) NOT NULL,
  "applied_at" timestamptz NOT NULL DEFAULT now(),
  "applied_by" varchar(100),
  "rows_affected" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "sgie_schema_migrations_name_idx" ON "sgie_schema_migrations"("name");
