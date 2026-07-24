-- Migration 0053: Add events table for risk-service deadlines
-- The risk-service references this table for overdue deadline calculations.
CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type" varchar(100) NOT NULL,
  "resource_id" uuid,
  "resource_type" varchar(50),
  "due_date" timestamp with time zone,
  "payload" jsonb DEFAULT '{}'::jsonb,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "events_resource_idx" ON "events"("resource_id");
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events"("event_type");
CREATE INDEX IF NOT EXISTS "events_due_date_idx" ON "events"("due_date");
