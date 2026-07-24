-- Migration 0052: Add idempotency_key to outbox_events
-- Prevents duplicate processing of the same logical event.
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(128);
-- Create unique constraint idempotently (ignore if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbox_events_idempotency_unique') THEN
    ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_idempotency_unique" UNIQUE ("idempotency_key");
  END IF;
END $$;
