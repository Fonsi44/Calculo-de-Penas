-- Migración 0029 — Fase 5 MVP: puerta "Listo para revisión".
--
-- OBJETIVO: crear las tablas de readiness (case_readiness_runs y
-- case_readiness_checks), añadir los estados de expediente listo_para_revision
-- y devuelto_por_abogado, y los eventos de auditoría de la Fase 5.
--
-- No rompe 0025–0028.

CREATE TABLE IF NOT EXISTS "case_readiness_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "expediente_id" uuid NOT NULL,
  "estado_final" varchar(40) NOT NULL,
  "score" integer DEFAULT 0,
  "checks_total" integer DEFAULT 0,
  "checks_pass" integer DEFAULT 0,
  "checks_warn" integer DEFAULT 0,
  "checks_fail" integer DEFAULT 0,
  "iniciado_por" varchar(50) DEFAULT 'sistema',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_readiness_runs" ADD CONSTRAINT "case_readiness_runs_expediente_id_expedientes_id_fk"
  FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_readiness_runs_expediente_idx" ON "case_readiness_runs" ("expediente_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_readiness_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "expediente_id" uuid NOT NULL,
  "check_name" varchar(80) NOT NULL,
  "status" varchar(20) DEFAULT 'unknown' NOT NULL,
  "source" varchar(30) DEFAULT 'system',
  "blocking" boolean DEFAULT false,
  "reason" text,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_readiness_checks" ADD CONSTRAINT "case_readiness_checks_run_id_case_readiness_runs_id_fk"
  FOREIGN KEY ("run_id") REFERENCES "case_readiness_runs"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "case_readiness_checks" ADD CONSTRAINT "case_readiness_checks_expediente_id_expedientes_id_fk"
  FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "case_readiness_checks_run_check_unique"
  ON "case_readiness_checks" ("run_id", "check_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_readiness_checks_expediente_idx" ON "case_readiness_checks" ("expediente_id");
--> statement-breakpoint
-- Nuevos estados de expediente (Fase 5).
ALTER TYPE "expediente_estado" ADD VALUE IF NOT EXISTS 'listo_para_revision';
--> statement-breakpoint
ALTER TYPE "expediente_estado" ADD VALUE IF NOT EXISTS 'devuelto_por_abogado';
--> statement-breakpoint
-- Eventos de auditoría de la Fase 5.
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'readiness_evaluation_completed';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'case_ready_for_review';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'case_returned_by_lawyer';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'case_documental_review_approved';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'case_additional_info_requested';
