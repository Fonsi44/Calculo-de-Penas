-- Migración 0028 — Fase 4 MVP: IA documental (DeepSeek V4 Flash).
--
-- OBJETIVO: extender extracciones_ia para registrar el estado sugerido de la
-- IA (prevalidado/advertencia/revision_*/correccion/rechazado), el score
-- compuesto documento-expediente, el hash de entrada (idempotencia) y el
-- estado del run; y añadir eventos de auditoría del análisis IA.
--
-- Decisión: suggested_status es METADATA de la IA, no estado operativo del
-- documento (no se toca el enum documento_estado). El humano decide.
--
-- No rompe 0025, 0026 ni 0027.

ALTER TABLE "extracciones_ia" ADD COLUMN IF NOT EXISTS "suggested_status" varchar(50);
--> statement-breakpoint
ALTER TABLE "extracciones_ia" ADD COLUMN IF NOT EXISTS "total_confidence" integer;
--> statement-breakpoint
ALTER TABLE "extracciones_ia" ADD COLUMN IF NOT EXISTS "input_hash" varchar(64);
--> statement-breakpoint
ALTER TABLE "extracciones_ia" ADD COLUMN IF NOT EXISTS "run_status" varchar(20) DEFAULT 'completed';
--> statement-breakpoint
-- Eventos de auditoría del análisis IA (Fase 4).
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_analysis_started';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_analysis_completed';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_analysis_failed';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_analysis_skipped_no_text';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_analysis_not_configured';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_suggestion_accepted';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_suggestion_rejected';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_human_review_requested';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'ai_correction_requested';
