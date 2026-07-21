-- Migration 0046: P2-09 — Firma electrónica mediante proveedor desacoplado (Fase 4B-3)
--
-- Añade:
-- 1. signature_envelopes — cabecera del sobre de firma electrónica.
-- 2. signature_envelope_signers — estado de cada firmante en el sobre.
-- 3. signature_events — eventos recibidos del proveedor (webhooks/polling).
-- 4. signature_artifacts — documentos firmados, certificados y audit trails.
-- 5. Enum values de auditoría para firma electrónica.
-- 6. Seed feature flags y capacidades para P2-09.
--
-- Idempotente (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / ON CONFLICT).
--
-- Rollback documentado:
--   DROP TABLE IF EXISTS signature_artifacts CASCADE;
--   DROP TABLE IF EXISTS signature_events CASCADE;
--   DROP TABLE IF EXISTS signature_envelope_signers CASCADE;
--   DROP TABLE IF EXISTS signature_envelopes CASCADE;
--   ALTER TYPE auditoria_accion no soporta DROP VALUE.
--   DELETE FROM feature_flags WHERE flag_key IN ('sgie.signature.enabled');
--   DELETE FROM permisos WHERE recurso='signature' AND accion IN ('send','read','cancel','retry');

-- ─── 1. Sobre de firma electrónica ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_envelopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "signature_package_id" uuid NOT NULL REFERENCES "signature_packages"("id"),
  "package_version" integer NOT NULL,
  "provider" varchar(50) NOT NULL,
  "provider_envelope_id" varchar(200),
  "estado_interno" varchar(40) NOT NULL DEFAULT 'draft',
  "estado_externo" varchar(100),
  "idempotency_key" varchar(120) NOT NULL,
  "correlation_id" varchar(64),
  "created_by" uuid NOT NULL REFERENCES "usuarios"("id"),
  "sent_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "declined_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "expired_at" timestamp with time zone,
  "last_synced_at" timestamp with time zone,
  "provider_metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "cancel_motivo" text,
  "version" integer NOT NULL DEFAULT 1,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un envelope activo por paquete y versión.
CREATE UNIQUE INDEX IF NOT EXISTS "signature_envelopes_pkg_version_active_unique"
  ON "signature_envelopes"("signature_package_id", "package_version")
  WHERE "estado_interno" NOT IN ('cancelled', 'declined', 'expired', 'completed');
-- Idempotencia por paquete + key.
CREATE UNIQUE INDEX IF NOT EXISTS "signature_envelopes_pkg_idem_unique"
  ON "signature_envelopes"("signature_package_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "signature_envelopes_exp_estado_idx"
  ON "signature_envelopes"("expediente_id", "estado_interno");
CREATE INDEX IF NOT EXISTS "signature_envelopes_provider_id_idx"
  ON "signature_envelopes"("provider_envelope_id");

-- ─── 2. Firmantes en el sobre ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_envelope_signers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "envelope_id" uuid NOT NULL REFERENCES "signature_envelopes"("id") ON DELETE CASCADE,
  "package_signer_id" uuid NOT NULL REFERENCES "signature_package_signers"("id"),
  "provider_signer_id" varchar(200),
  "nombre" varchar(300) NOT NULL,
  "email" varchar(255),
  "identificador" varchar(100),
  "rol_documento" varchar(100) NOT NULL,
  "orden" integer NOT NULL DEFAULT 0,
  "obligatorio" boolean NOT NULL DEFAULT true,
  "estado" varchar(30) NOT NULL DEFAULT 'pending',
  "viewed_at" timestamp with time zone,
  "signed_at" timestamp with time zone,
  "declined_at" timestamp with time zone,
  "failure_reason" text,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un firmante una sola vez por envelope.
CREATE UNIQUE INDEX IF NOT EXISTS "signature_envelope_signers_env_signer_unique"
  ON "signature_envelope_signers"("envelope_id", "package_signer_id");
CREATE INDEX IF NOT EXISTS "signature_envelope_signers_env_idx"
  ON "signature_envelope_signers"("envelope_id");

-- ─── 3. Eventos del proveedor ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "envelope_id" uuid NOT NULL REFERENCES "signature_envelopes"("id") ON DELETE CASCADE,
  "provider" varchar(50) NOT NULL,
  "provider_event_id" varchar(200),
  "tipo" varchar(100) NOT NULL,
  "payload_hash" varchar(64),
  "occurred_at" timestamp with time zone NOT NULL,
  "received_at" timestamp with time zone NOT NULL DEFAULT now(),
  "verified" boolean NOT NULL DEFAULT true,
  "processed_at" timestamp with time zone,
  "result" varchar(100),
  "error" text,
  "correlation_id" varchar(64)
);
-- Un evento de proveedor se registra una sola vez.
CREATE UNIQUE INDEX IF NOT EXISTS "signature_events_provider_event_unique"
  ON "signature_events"("provider", "provider_event_id");
CREATE INDEX IF NOT EXISTS "signature_events_envelope_idx"
  ON "signature_events"("envelope_id");

-- ─── 4. Artefactos firmados ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_artifacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "envelope_id" uuid NOT NULL REFERENCES "signature_envelopes"("id") ON DELETE CASCADE,
  "tipo" varchar(50) NOT NULL,
  "blob_url" varchar(1000),
  "nombre" varchar(500) NOT NULL,
  "mime" varchar(200),
  "tamano_bytes" integer,
  "hash_sha256" varchar(64),
  "provider_artifact_id" varchar(200),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "verified_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "signature_artifacts_envelope_idx"
  ON "signature_artifacts"("envelope_id");

-- ─── 5. Enum de auditoría ──────────────────────────────────────────────────
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_envelope_created';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_envelope_sent';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_envelope_completed';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_envelope_cancelled';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_envelope_declined';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_envelope_expired';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_webhook_received';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_artifact_downloaded';

-- ─── 6. Seed: capacidades de firma ─────────────────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('signature', 'send', 'Enviar paquetes a firma electrónica'),
  ('signature', 'read', 'Consultar estado de firmas'),
  ('signature', 'cancel', 'Cancelar solicitudes de firma'),
  ('signature', 'retry', 'Reintentar envíos fallidos de firma')
ON CONFLICT ("recurso", "accion") DO NOTHING;

-- ─── 7. Asignar capacidades a roles ────────────────────────────────────────
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador', 'supervisor')
  AND p.recurso = 'signature'
  AND p.accion IN ('send', 'read', 'cancel', 'retry')
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

-- ─── 8. Seed feature flags ─────────────────────────────────────────────────
INSERT INTO "feature_flags"
  ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
VALUES
  ('sgie.signature.enabled', 'global', false, false, 'P2-09 deny-by-default', now(), now())
ON CONFLICT DO NOTHING;

-- ─── 9. Seed job type ──────────────────────────────────────────────────────
-- El enum job_sgie_tipo se gestiona vía schema.ts; el runner SQL no puede
-- añadir valores a enum en la misma transacción que otras operaciones DDL.
-- La aplicación usa el valor 'signature_reconcile' vía Drizzle push.
