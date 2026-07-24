-- Migration 0052: Add idempotency_key to outbox_events
-- Prevents duplicate processing of the same logical event.
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(128);
-- Drop existing index if it exists, then create unique constraint
DROP INDEX IF EXISTS "outbox_events_idempotency_unique";
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_idempotency_unique" UNIQUE ("idempotency_key");
