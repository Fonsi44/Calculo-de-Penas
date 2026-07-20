-- Migration 0044: P2-07 — Aprobación documental en bloque (Fase 4B-1)
--
-- Añade:
-- 1. Columna `version` a documentos_expediente (control optimista por doc).
-- 2. Enum values de auditoría documento_bulk_approved / documento_bulk_reverted.
-- 3. Tablas document_bulk_approvals (cabecera de lote) y
--    document_bulk_approval_items (resultados individuales).
-- 4. Seed feature flag sgie.documents.bulk_approve (deny-by-default, global off).
--
-- Idempotente (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / ON CONFLICT).
--
-- Rollback (no se ejecuta aquí; documentado):
--   DROP TABLE IF EXISTS document_bulk_approval_items CASCADE;
--   DROP TABLE IF EXISTS document_bulk_approvals CASCADE;
--   DROP INDEX IF EXISTS documentos_expediente_id_version_idx;
--   ALTER TABLE documentos_expediente DROP COLUMN IF EXISTS version;
--   -- Los enum values no se pueden eliminar sin recrear el type; en su lugar
--   -- se marcan como no usados. Para rollback completo:
--   --   CREATE TYPE auditoria_accion_new AS ENUM (..., <sin los dos nuevos>);
--   --   ALTER TABLE auditoria_eventos ALTER COLUMN accion TYPE auditoria_accion_new USING accion::text::auditoria_accion_new;
--   --   DROP TYPE auditoria_accion; ALTER TYPE auditoria_accion_new RENAME TO auditoria_accion;
--   DELETE FROM feature_flags WHERE flag_key = 'sgie.documents.bulk_approve';

-- ─── 1. Control optimista: version por documento ────────────────────────────
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "documentos_expediente_id_version_idx" ON "documentos_expediente"("id", "version");

-- ─── 2. Enum de auditoría: acciones de bulk approval ────────────────────────
-- ALTER TYPE ... ADD VALUE no es transaccional en PG; se ejecuta fuera de la
-- transacción del aplicador. IF NOT EXISTS evita error en segunda aplicación.
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'documento_bulk_approved';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'documento_bulk_reverted';

-- ─── 3. Cabecera de lote de aprobación ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "document_bulk_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "actor_id" uuid NOT NULL REFERENCES "usuarios"("id"),
  "idempotency_key" varchar(100) NOT NULL,
  "preview_hash" varchar(64) NOT NULL,
  "estado" varchar(30) NOT NULL DEFAULT 'pendiente', -- pendiente|confirmada|parcial|revertida|fallida|expirada
  "preview_caducidad" timestamp with time zone NOT NULL,
  "confirmada_en" timestamp with time zone,
  "correlation_id" varchar(64),
  "motivo" text,
  "total" integer NOT NULL DEFAULT 0,
  "aprobados" integer NOT NULL DEFAULT 0,
  "ya_aprobados" integer NOT NULL DEFAULT 0,
  "rechazados" integer NOT NULL DEFAULT 0,
  "resultados" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Idempotencia por lote: (expediente, idempotency_key) único.
CREATE UNIQUE INDEX IF NOT EXISTS "document_bulk_approvals_exp_idem_unique"
  ON "document_bulk_approvals"("expediente_id", "idempotency_key");
-- Una preview activa por expediente (pendiente/confirmada/parcial).
CREATE UNIQUE INDEX IF NOT EXISTS "document_bulk_approvals_exp_preview_active_unique"
  ON "document_bulk_approvals"("expediente_id", "preview_hash")
  WHERE "estado" IN ('pendiente', 'confirmada', 'parcial');
CREATE INDEX IF NOT EXISTS "document_bulk_approvals_actor_creado_idx"
  ON "document_bulk_approvals"("actor_id", "creado_en");
CREATE INDEX IF NOT EXISTS "document_bulk_approvals_exp_estado_idx"
  ON "document_bulk_approvals"("expediente_id", "estado");

-- ─── 4. Items individuales del lote (resultados por documento) ──────────────
CREATE TABLE IF NOT EXISTS "document_bulk_approval_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bulk_approval_id" uuid NOT NULL REFERENCES "document_bulk_approvals"("id") ON DELETE CASCADE,
  "document_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "expediente_id" uuid NOT NULL,
  "version_snapshot" integer NOT NULL,
  "tipo_documento" varchar(100),
  "requisito_id" uuid,
  "estado_previo" varchar(30),
  "resultado" varchar(30) NOT NULL DEFAULT 'pendiente', -- aprobado|ya_aprobado|rechazado_validacion|conflicto_version|no_autorizado|error_tecnico|revertido
  "motivo" text,
  "decidido_en" timestamp with time zone,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un documento una sola vez por lote.
CREATE UNIQUE INDEX IF NOT EXISTS "document_bulk_approval_items_bulk_doc_unique"
  ON "document_bulk_approval_items"("bulk_approval_id", "document_id");
CREATE INDEX IF NOT EXISTS "document_bulk_approval_items_doc_idx"
  ON "document_bulk_approval_items"("document_id");
CREATE INDEX IF NOT EXISTS "document_bulk_approval_items_bulk_resultado_idx"
  ON "document_bulk_approval_items"("bulk_approval_id", "resultado");

-- ─── 5. Seed feature flag: sgie.documents.bulk_approve (deny-by-default) ────
-- Desactivada globalmente. Solo se activa por scope en staging/test.
INSERT INTO "feature_flags"
  ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
VALUES
  ('sgie.documents.bulk_approve', 'global', false, false, 'P2-07 bulk approval — deny-by-default', now(), now())
ON CONFLICT DO NOTHING;
