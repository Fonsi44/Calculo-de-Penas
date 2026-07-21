-- Migration 0048: P2-10 — Calendar external sync (Fase 4B-4)
--
-- Añade:
-- 1. calendar_connections — vinculación de cuenta a calendario externo.
-- 2. calendar_event_links — tracking de sincronización ida y vuelta.
-- 3. calendar_sync_runs — trazabilidad de ejecuciones de sincronización.
-- 4. calendar_feed_tokens — tokens de feed ICS de solo lectura.
-- 5. Enum values de auditoría para calendario externo.
-- 6. Seed feature flags y capacidades para P2-10.
--
-- Idempotente (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / ON CONFLICT).
--
-- Rollback documentado:
--   DROP TABLE IF EXISTS calendar_feed_tokens CASCADE;
--   DROP TABLE IF EXISTS calendar_sync_runs CASCADE;
--   DROP TABLE IF EXISTS calendar_event_links CASCADE;
--   DROP TABLE IF EXISTS calendar_connections CASCADE;
--   ALTER TYPE auditoria_accion no soporta DROP VALUE.
--   DELETE FROM feature_flags WHERE flag_key IN ('sgie.calendar.ics.enabled');
--   DELETE FROM permisos WHERE recurso='calendar' AND accion IN ('external.connect','external.read');

-- ─── 1. Conexiones a calendarios externos ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "calendar_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "user_id" uuid NOT NULL REFERENCES "usuarios"("id"),
  "provider" varchar(50) NOT NULL,
  "external_account_id" varchar(200),
  "external_calendar_id" varchar(200),
  "estado" varchar(30) NOT NULL DEFAULT 'activo',
  "sync_direction" varchar(20) NOT NULL DEFAULT 'bidirectional',
  "timezone" varchar(100) NOT NULL DEFAULT 'America/Tegucigalpa',
  "privacy_policy" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "cursor" text,
  "last_sync_at" timestamp with time zone,
  "last_successful_sync_at" timestamp with time zone,
  "disconnected_at" timestamp with time zone,
  "version" integer NOT NULL DEFAULT 1,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un usuario solo puede tener una conexión por proveedor.
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_user_provider_unique"
  ON "calendar_connections"("user_id", "provider");
CREATE INDEX IF NOT EXISTS "calendar_connections_estado_idx"
  ON "calendar_connections"("estado");
CREATE INDEX IF NOT EXISTS "calendar_connections_last_sync_idx"
  ON "calendar_connections"("last_sync_at");

-- ─── 2. Vínculos de eventos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "calendar_event_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "internal_event_id" uuid NOT NULL REFERENCES "eventos_agenda"("id") ON DELETE CASCADE,
  "connection_id" uuid NOT NULL REFERENCES "calendar_connections"("id") ON DELETE CASCADE,
  "provider" varchar(50) NOT NULL,
  "external_event_id" varchar(200),
  "ical_uid" varchar(300) NOT NULL,
  "external_etag" varchar(100),
  "internal_version" integer NOT NULL DEFAULT 1,
  "last_synced_internal_version" integer,
  "last_external_modified_at" timestamp with time zone,
  "sync_state" varchar(30) NOT NULL DEFAULT 'pending',
  "conflict_state" varchar(30),
  "deleted_internally_at" timestamp with time zone,
  "deleted_externally_at" timestamp with time zone,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un evento solo puede estar vinculado una vez por conexión.
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_event_links_event_conn_unique"
  ON "calendar_event_links"("internal_event_id", "connection_id");
CREATE INDEX IF NOT EXISTS "calendar_event_links_connection_idx"
  ON "calendar_event_links"("connection_id");
CREATE INDEX IF NOT EXISTS "calendar_event_links_sync_state_idx"
  ON "calendar_event_links"("sync_state");
CREATE INDEX IF NOT EXISTS "calendar_event_links_conflict_state_idx"
  ON "calendar_event_links"("conflict_state") WHERE "conflict_state" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "calendar_event_links_external_event_idx"
  ON "calendar_event_links"("provider", "external_event_id") WHERE "external_event_id" IS NOT NULL;

-- ─── 3. Trazabilidad de ejecuciones de sincronización ───────────────────────
CREATE TABLE IF NOT EXISTS "calendar_sync_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "connection_id" uuid NOT NULL REFERENCES "calendar_connections"("id") ON DELETE CASCADE,
  "tipo" varchar(30) NOT NULL,
  "claimed_at" timestamp with time zone,
  "locked_until" timestamp with time zone,
  "attempts" integer NOT NULL DEFAULT 0,
  "next_attempt_at" timestamp with time zone,
  "processed" integer NOT NULL DEFAULT 0,
  "errores" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "correlation_id" varchar(64),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "calendar_sync_runs_connection_idx"
  ON "calendar_sync_runs"("connection_id");
CREATE INDEX IF NOT EXISTS "calendar_sync_runs_tipo_idx"
  ON "calendar_sync_runs"("tipo");
CREATE INDEX IF NOT EXISTS "calendar_sync_runs_locked_until_idx"
  ON "calendar_sync_runs"("locked_until") WHERE "locked_until" IS NOT NULL;

-- ─── 4. Tokens de feed ICS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "calendar_feed_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "usuarios"("id"),
  "token_hash" varchar(64) NOT NULL,
  "scope" varchar(30) NOT NULL DEFAULT 'read_only',
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_feed_tokens_hash_unique"
  ON "calendar_feed_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "calendar_feed_tokens_user_idx"
  ON "calendar_feed_tokens"("user_id");

-- ─── 5. Enum de auditoría ──────────────────────────────────────────────────
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'calendar_connection_created';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'calendar_event_synced';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'calendar_event_sync_failed';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'calendar_conflict_resolved';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'calendar_feed_created';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'calendar_feed_revoked';

-- ─── 6. Seed: capacidades de calendario externo ─────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('calendar', 'external.connect', 'Conectar y gestionar calendarios externos'),
  ('calendar', 'external.read', 'Consultar eventos de calendarios externos')
ON CONFLICT ("recurso", "accion") DO NOTHING;

-- ─── 7. Asignar capacidades a roles ────────────────────────────────────────
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador', 'supervisor')
  AND p.recurso = 'calendar'
  AND p.accion IN ('external.connect', 'external.read')
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

-- ─── 8. Seed feature flags ─────────────────────────────────────────────────
INSERT INTO "feature_flags"
  ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
VALUES
  ('sgie.calendar.external', 'global', false, false, 'P2-10 deny-by-default', now(), now()),
  ('sgie.calendar.ics.enabled', 'global', false, false, 'P2-10 deny-by-default', now(), now())
ON CONFLICT DO NOTHING;
