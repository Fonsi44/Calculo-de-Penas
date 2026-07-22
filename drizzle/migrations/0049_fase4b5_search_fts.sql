-- Migration 0049: Fase 4B-5 — Retrieval textual con PostgreSQL FTS + pg_trgm
--
-- Añade:
-- 1. Extensiones pg_trgm y unaccent.
-- 2. Tabla sgie_search_entries (proyección de búsqueda autorizable).
-- 3. Índices GIN para tsvector y pg_trgm.
-- 4. Índices de organización, expediente, recurso, sensibilidad y estado.
-- 5. Seed feature flags y capacidades de búsqueda.
--
-- Idempotente (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / ON CONFLICT).

-- ─── 1. Extensiones ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─── 2. Proyección de búsqueda ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "sgie_search_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "resource_type" varchar(40) NOT NULL,
  "resource_id" uuid NOT NULL,
  "expediente_id" uuid,
  "document_id" uuid,
  "document_version_id" integer,
  "page_number" integer,
  "owner_user_id" uuid,
  "sensitivity" varchar(20) NOT NULL DEFAULT 'internal',
  "approval_status" varchar(30),
  "valid_from" timestamp with time zone,
  "valid_until" timestamp with time zone,
  "title" varchar(500) NOT NULL,
  "normalized_title" varchar(500),
  "content" text,
  "content_hash" varchar(64),
  "search_vector" tsvector,
  "source_version" integer NOT NULL DEFAULT 1,
  "indexed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb
);
-- Unicidad por recurso, versión y página (si aplica).
CREATE UNIQUE INDEX IF NOT EXISTS "sgie_search_entries_resource_unique"
  ON "sgie_search_entries"("resource_type", "resource_id", "document_version_id", COALESCE("page_number", 0));
-- Índices de autorización (se aplican ANTES de recuperar).
CREATE INDEX IF NOT EXISTS "sgie_search_entries_org_idx"
  ON "sgie_search_entries"("organization_id");
CREATE INDEX IF NOT EXISTS "sgie_search_entries_exp_idx"
  ON "sgie_search_entries"("expediente_id");
CREATE INDEX IF NOT EXISTS "sgie_search_entries_owner_idx"
  ON "sgie_search_entries"("owner_user_id");
CREATE INDEX IF NOT EXISTS "sgie_search_entries_sensitivity_idx"
  ON "sgie_search_entries"("sensitivity");
CREATE INDEX IF NOT EXISTS "sgie_search_entries_approval_idx"
  ON "sgie_search_entries"("approval_status");
-- Índices GIN para FTS.
CREATE INDEX IF NOT EXISTS "sgie_search_entries_fts_idx"
  ON "sgie_search_entries" USING gin("search_vector");
-- Índices GIN para pg_trgm (título y contenido).
CREATE INDEX IF NOT EXISTS "sgie_search_entries_title_trgm_idx"
  ON "sgie_search_entries" USING gin("normalized_title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "sgie_search_entries_content_trgm_idx"
  ON "sgie_search_entries" USING gin("content" gin_trgm_ops);
-- Índice compuesto para filtrado rápido.
CREATE INDEX IF NOT EXISTS "sgie_search_entries_type_exp_idx"
  ON "sgie_search_entries"("resource_type", "expediente_id");
CREATE INDEX IF NOT EXISTS "sgie_search_entries_deleted_idx"
  ON "sgie_search_entries"("deleted_at") WHERE "deleted_at" IS NOT NULL;

-- ─── 3. Trigger para mantener tsvector actualizado ─────────────────────────
CREATE OR REPLACE FUNCTION sgie_search_entries_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.normalized_title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sgie_search_entries_tsvector_trigger ON sgie_search_entries;
CREATE TRIGGER sgie_search_entries_tsvector_trigger
  BEFORE INSERT OR UPDATE ON sgie_search_entries
  FOR EACH ROW EXECUTE FUNCTION sgie_search_entries_tsvector_update();

-- ─── 4. Seed feature flags ─────────────────────────────────────────────────
INSERT INTO "feature_flags"
  ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
VALUES
  ('sgie.search.full_text', 'global', false, false, 'Fase 4B-5 deny-by-default', now(), now()),
  ('sgie.search.trigram', 'global', false, false, 'Fase 4B-5 deny-by-default', now(), now())
ON CONFLICT DO NOTHING;

-- ─── 5. Actualizar sgie.retrieval.fts si ya existe como placeholder ───────
-- Dejar deny-by-default; solo se activa por scope en test/staging.

-- ─── 6. Seed capacidades de búsqueda ──────────────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('search', 'use', 'Usar búsqueda textual en recursos autorizados'),
  ('search', 'reindex', 'Reindexar recursos manualmente'),
  ('search', 'configure', 'Configurar parámetros de búsqueda')
ON CONFLICT ("recurso", "accion") DO NOTHING;

-- Asignar a roles admin/supervisor.
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador', 'supervisor')
  AND p.recurso = 'search'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
