-- Migration 0047: P2-09 reconciliation durability (Fase 4B-3)
--
-- Añade columnas de bloqueo e intentos a signature_envelopes
-- para reconciliación concurrente segura con backoff.
--
-- Idempotente (ADD COLUMN IF NOT EXISTS).

ALTER TABLE "signature_envelopes" ADD COLUMN IF NOT EXISTS "reconcile_locked_at" timestamp with time zone;
ALTER TABLE "signature_envelopes" ADD COLUMN IF NOT EXISTS "reconcile_attempts" integer NOT NULL DEFAULT 0;
ALTER TABLE "signature_envelopes" ADD COLUMN IF NOT EXISTS "reconcile_next_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "signature_envelopes_reconcile_idx"
  ON "signature_envelopes"("estado_interno", "reconcile_next_at");
