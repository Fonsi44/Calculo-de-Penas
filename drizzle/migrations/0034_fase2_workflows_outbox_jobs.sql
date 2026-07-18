-- Migration 0034: Phase 2 — Workflow engine, outbox, durable jobs

-- Add dead_lettered to job_sgie_estado enum
ALTER TYPE "job_sgie_estado" ADD VALUE IF NOT EXISTS 'dead_lettered';

-- 1. Procedimiento Versiones (versioned templates extending tipos_procedimiento)
CREATE TABLE IF NOT EXISTS "procedimiento_versiones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "procedimiento_id" uuid NOT NULL REFERENCES "tipos_procedimiento"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "definicion" jsonb,
  "estado" varchar(50) NOT NULL DEFAULT 'pendiente_validacion_legal',
  "creado_por" uuid REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "procedimiento_versiones_procedimiento_idx" ON "procedimiento_versiones"("procedimiento_id");
CREATE UNIQUE INDEX IF NOT EXISTS "procedimiento_versiones_version_unique" ON "procedimiento_versiones"("procedimiento_id", "version");

-- 2. Procedimiento Fases (phases within a workflow version)
CREATE TABLE IF NOT EXISTS "procedimiento_fases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "procedimiento_version_id" uuid NOT NULL REFERENCES "procedimiento_versiones"("id") ON DELETE CASCADE,
  "nombre" varchar(200) NOT NULL,
  "slug" varchar(200) NOT NULL,
  "orden" integer NOT NULL DEFAULT 0,
  "descripcion" text,
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "procedimiento_fases_version_idx" ON "procedimiento_fases"("procedimiento_version_id");
CREATE UNIQUE INDEX IF NOT EXISTS "procedimiento_fases_version_slug_unique" ON "procedimiento_fases"("procedimiento_version_id", "slug");

-- 3. Procedimiento Transiciones (transition rules between phases)
CREATE TABLE IF NOT EXISTS "procedimiento_transiciones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "procedimiento_version_id" uuid NOT NULL REFERENCES "procedimiento_versiones"("id") ON DELETE CASCADE,
  "desde_fase_id" uuid NOT NULL REFERENCES "procedimiento_fases"("id") ON DELETE CASCADE,
  "hacia_fase_id" uuid NOT NULL REFERENCES "procedimiento_fases"("id") ON DELETE CASCADE,
  "nombre" varchar(200),
  "condiciones" jsonb,
  "actores_permitidos" text[] DEFAULT ARRAY['abogado','admin','sistema'],
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "procedimiento_transiciones_version_idx" ON "procedimiento_transiciones"("procedimiento_version_id");
CREATE INDEX IF NOT EXISTS "procedimiento_transiciones_desde_idx" ON "procedimiento_transiciones"("desde_fase_id");
CREATE INDEX IF NOT EXISTS "procedimiento_transiciones_hacia_idx" ON "procedimiento_transiciones"("hacia_fase_id");

-- 4. Expediente Fases (phase instances per expediente)
CREATE TABLE IF NOT EXISTS "expediente_fases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "fase_id" uuid NOT NULL REFERENCES "procedimiento_fases"("id"),
  "entrada_en" timestamp with time zone DEFAULT now(),
  "salida_en" timestamp with time zone,
  "metadata" jsonb,
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "expediente_fases_expediente_idx" ON "expediente_fases"("expediente_id");
CREATE INDEX IF NOT EXISTS "expediente_fases_fase_idx" ON "expediente_fases"("fase_id");

-- 5. Outbox Events (transactional outbox pattern)
CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type" varchar(100) NOT NULL,
  "aggregate_id" varchar(100),
  "aggregate_type" varchar(100),
  "payload" jsonb NOT NULL DEFAULT '{}',
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "intentos" integer DEFAULT 0,
  "max_intentos" integer DEFAULT 3,
  "error" text,
  "locked_at" timestamp with time zone,
  "lock_expires_at" timestamp with time zone,
  "worker_id" varchar(100),
  "correlation_id" varchar(64),
  "creado_en" timestamp with time zone DEFAULT now(),
  "procesado_en" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "outbox_events_status_idx" ON "outbox_events"("status");
CREATE INDEX IF NOT EXISTS "outbox_events_event_type_idx" ON "outbox_events"("event_type");
CREATE INDEX IF NOT EXISTS "outbox_events_creado_en_idx" ON "outbox_events"("creado_en");

-- 6. Job Attempts (history of job execution attempts)
CREATE TABLE IF NOT EXISTS "job_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" uuid NOT NULL REFERENCES "jobs_sgie"("id") ON DELETE CASCADE,
  "numero_intento" integer NOT NULL,
  "estado" varchar(30) NOT NULL DEFAULT 'running',
  "iniciado_en" timestamp with time zone DEFAULT now(),
  "completado_en" timestamp with time zone,
  "error" text,
  "error_code" varchar(100),
  "output" jsonb,
  "correlation_id" varchar(64)
);
CREATE INDEX IF NOT EXISTS "job_attempts_job_idx" ON "job_attempts"("job_id");

-- 7. Dead Letter Jobs (failed jobs moved to DLQ)
CREATE TABLE IF NOT EXISTS "dead_letter_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" uuid REFERENCES "jobs_sgie"("id") ON DELETE SET NULL,
  "tipo" varchar(100) NOT NULL,
  "ref_id" uuid,
  "payload" jsonb,
  "motivo" text,
  "error_final" text,
  "error_code" varchar(100),
  "intentos_totales" integer DEFAULT 0,
  "correlation_id" varchar(64),
  "enviado_a_dlq_en" timestamp with time zone DEFAULT now(),
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "dead_letter_jobs_tipo_idx" ON "dead_letter_jobs"("tipo");
CREATE INDEX IF NOT EXISTS "dead_letter_jobs_enviado_idx" ON "dead_letter_jobs"("enviado_a_dlq_en");

-- 8. Add durable job fields to jobs_sgie
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "next_run_at" timestamp with time zone;
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "locked_at" timestamp with time zone;
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "lock_expires_at" timestamp with time zone;
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "worker_id" varchar(100);
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "last_error_code" varchar(100);
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "dead_lettered_at" timestamp with time zone;
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "correlation_id" varchar(100);
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "pipeline" varchar(50) DEFAULT 'default';
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0;
ALTER TABLE "jobs_sgie" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100);
ALTER TABLE "jobs_sgie" ALTER COLUMN "intentos" SET DEFAULT 0;
ALTER TABLE "jobs_sgie" ALTER COLUMN "max_intentos" SET DEFAULT 3;

CREATE INDEX IF NOT EXISTS "jobs_sgie_idempotency_key_idx" ON "jobs_sgie"("idempotency_key");
CREATE INDEX IF NOT EXISTS "jobs_sgie_next_run_idx" ON "jobs_sgie"("next_run_at");

-- 9. Comunicaciones Outbox (durable communication queue)
CREATE TABLE IF NOT EXISTS "comunicaciones_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "tipo" varchar(50) NOT NULL,
  "destinatario" varchar(255) NOT NULL,
  "asunto" varchar(300),
  "cuerpo" text,
  "estado" varchar(30) NOT NULL DEFAULT 'pending',
  "intentos" integer DEFAULT 0,
  "max_intentos" integer DEFAULT 3,
  "error" text,
  "programado_para" timestamp with time zone,
  "enviado_en" timestamp with time zone,
  "creado_por" uuid REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "comunicaciones_outbox_expediente_idx" ON "comunicaciones_outbox"("expediente_id");
CREATE INDEX IF NOT EXISTS "comunicaciones_outbox_estado_idx" ON "comunicaciones_outbox"("estado");

-- 10. Comunicaciones Aprobaciones (approval log)
CREATE TABLE IF NOT EXISTS "comunicaciones_aprobaciones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "comunicacion_id" uuid NOT NULL REFERENCES "comunicaciones_outbox"("id") ON DELETE CASCADE,
  "estado" varchar(30) NOT NULL DEFAULT 'pending',
  "aprobado_por" uuid REFERENCES "usuarios"("id"),
  "rechazado_por" uuid REFERENCES "usuarios"("id"),
  "comentario" text,
  "creado_en" timestamp with time zone DEFAULT now(),
  "resuelto_en" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "comunicaciones_aprobaciones_comunicacion_idx" ON "comunicaciones_aprobaciones"("comunicacion_id");

-- 11. Webhook Receipts
CREATE TABLE IF NOT EXISTS "webhook_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "fuente" varchar(100) NOT NULL,
  "event_type" varchar(100),
  "payload" jsonb NOT NULL DEFAULT '{}',
  "estado" varchar(30) NOT NULL DEFAULT 'received',
  "recibido_en" timestamp with time zone DEFAULT now(),
  "procesado_en" timestamp with time zone,
  "error" text
);
CREATE INDEX IF NOT EXISTS "webhook_receipts_fuente_idx" ON "webhook_receipts"("fuente");
CREATE INDEX IF NOT EXISTS "webhook_receipts_estado_idx" ON "webhook_receipts"("estado");
