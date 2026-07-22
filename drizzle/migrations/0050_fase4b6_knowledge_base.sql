-- Migration 0050: Fase 4B-6 — Base de conocimiento jurídica versionada
--
-- Añade tablas para fuentes jurídicas gobernadas, versionado inmutable,
-- aprobaciones, relaciones y auditoría.
--
-- Idempotente (IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- ─── Fuentes de conocimiento ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "knowledge_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "jurisdiction" varchar(100),
  "authority" varchar(300),
  "type" varchar(40) NOT NULL,
  "title" varchar(500) NOT NULL,
  "official_id" varchar(200),
  "source_url" text,
  "sensitivity" varchar(20) NOT NULL DEFAULT 'internal',
  "language" varchar(10) NOT NULL DEFAULT 'es',
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "estado" varchar(30) NOT NULL DEFAULT 'draft',
  "created_by" uuid NOT NULL REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "knowledge_sources_org_idx" ON "knowledge_sources"("organization_id");
CREATE INDEX IF NOT EXISTS "knowledge_sources_type_idx" ON "knowledge_sources"("type");
CREATE INDEX IF NOT EXISTS "knowledge_sources_estado_idx" ON "knowledge_sources"("estado");
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_sources_official_unique"
  ON "knowledge_sources"("official_id") WHERE "official_id" IS NOT NULL;

-- ─── Versiones de documento de conocimiento ────────────────────────────
CREATE TABLE IF NOT EXISTS "knowledge_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" uuid NOT NULL REFERENCES "knowledge_sources"("id") ON DELETE CASCADE,
  "version" integer NOT NULL DEFAULT 1,
  "content" text NOT NULL,
  "content_hash" varchar(64) NOT NULL,
  "sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "valid_from" timestamp with time zone,
  "valid_until" timestamp with time zone,
  "estado" varchar(30) NOT NULL DEFAULT 'draft',
  "created_by" uuid NOT NULL REFERENCES "usuarios"("id"),
  "reviewed_by" uuid REFERENCES "usuarios"("id"),
  "reviewed_at" timestamp with time zone,
  "approved_by" uuid REFERENCES "usuarios"("id"),
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "replaces_version_id" uuid,
  "change_motivo" text,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_versions_source_version_unique"
  ON "knowledge_versions"("source_id", "version");
CREATE INDEX IF NOT EXISTS "knowledge_versions_source_idx" ON "knowledge_versions"("source_id");
CREATE INDEX IF NOT EXISTS "knowledge_versions_estado_idx" ON "knowledge_versions"("estado");
CREATE INDEX IF NOT EXISTS "knowledge_versions_hash_idx" ON "knowledge_versions"("content_hash");

-- ─── Relaciones entre fuentes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "knowledge_relations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" uuid NOT NULL REFERENCES "knowledge_sources"("id") ON DELETE CASCADE,
  "related_source_id" uuid NOT NULL REFERENCES "knowledge_sources"("id") ON DELETE CASCADE,
  "relation_type" varchar(30) NOT NULL,
  "notes" text,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE("source_id", "related_source_id", "relation_type")
);

-- ─── Índice de búsqueda jurídica (proyección separada) ────────────────
CREATE TABLE IF NOT EXISTS "knowledge_index_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "source_id" uuid NOT NULL REFERENCES "knowledge_sources"("id") ON DELETE CASCADE,
  "version_id" uuid NOT NULL REFERENCES "knowledge_versions"("id") ON DELETE CASCADE,
  "section_index" integer,
  "section_title" varchar(500),
  "title" varchar(500) NOT NULL,
  "normalized_title" varchar(500),
  "content" text,
  "content_hash" varchar(64),
  "search_vector" tsvector,
  "jurisdiction" varchar(100),
  "type" varchar(40),
  "sensitivity" varchar(20) NOT NULL DEFAULT 'internal',
  "vigente" boolean NOT NULL DEFAULT false,
  "aprobado" boolean NOT NULL DEFAULT false,
  "indexed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "knowledge_index_org_idx" ON "knowledge_index_entries"("organization_id");
CREATE INDEX IF NOT EXISTS "knowledge_index_fts_idx" ON "knowledge_index_entries" USING gin("search_vector");
CREATE INDEX IF NOT EXISTS "knowledge_index_title_trgm_idx" ON "knowledge_index_entries" USING gin("normalized_title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "knowledge_index_aprobado_vigente_idx" ON "knowledge_index_entries"("aprobado", "vigente");

-- ─── Trigger tsvector ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION knowledge_index_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.normalized_title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS knowledge_index_tsvector_trigger ON knowledge_index_entries;
CREATE TRIGGER knowledge_index_tsvector_trigger
  BEFORE INSERT OR UPDATE ON knowledge_index_entries
  FOR EACH ROW EXECUTE FUNCTION knowledge_index_tsvector_update();

-- ─── Seed capabilities ─────────────────────────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('knowledge', 'read', 'Consultar base jurídica aprobada'),
  ('knowledge', 'create', 'Crear fuentes de conocimiento'),
  ('knowledge', 'review', 'Revisar contenido jurídico'),
  ('knowledge', 'approve', 'Aprobar contenido jurídico'),
  ('knowledge', 'publish', 'Publicar fuente jurídica'),
  ('knowledge', 'withdraw', 'Retirar fuente jurídica'),
  ('knowledge', 'configure', 'Configurar base de conocimiento')
ON CONFLICT ("recurso", "accion") DO NOTHING;

INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador') AND p.recurso = 'knowledge'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

-- ─── Seed feature flag ─────────────────────────────────────────────────
INSERT INTO "feature_flags"
  ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
VALUES
  ('sgie.knowledge.enabled', 'global', false, false, 'Fase 4B-6 deny-by-default', now(), now())
ON CONFLICT DO NOTHING;
