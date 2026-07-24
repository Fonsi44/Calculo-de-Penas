-- Migration 0051: Fase 5A-5D — Riesgo, carga, brief, métricas y portal
--
-- Idempotente (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / ON CONFLICT).

-- ─── 5A: Evaluaciones de riesgo ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "risk_evaluations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "risk_level" varchar(20) NOT NULL,
  "score" integer NOT NULL DEFAULT 0,
  "reasons" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "blocking_factors" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "due_dates" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "data_quality" integer NOT NULL DEFAULT 100,
  "confidence" integer NOT NULL DEFAULT 100,
  "suggested_actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "model_version" varchar(20) NOT NULL DEFAULT '1.0',
  "calculated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "risk_evaluations_exp_idx" ON "risk_evaluations"("expediente_id");
CREATE INDEX IF NOT EXISTS "risk_evaluations_level_idx" ON "risk_evaluations"("risk_level");

-- ─── 5A: Carga de trabajo ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "workload_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "active_cases" integer NOT NULL DEFAULT 0,
  "critical_cases" integer NOT NULL DEFAULT 0,
  "open_tasks" integer NOT NULL DEFAULT 0,
  "overdue_tasks" integer NOT NULL DEFAULT 0,
  "upcoming_deadlines" integer NOT NULL DEFAULT 0,
  "pending_documents" integer NOT NULL DEFAULT 0,
  "weighted_load" integer NOT NULL DEFAULT 0,
  "capacity" integer NOT NULL DEFAULT 100,
  "utilization" integer NOT NULL DEFAULT 0,
  "suggested_reassignments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "calculated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "workload_snapshots_user_idx" ON "workload_snapshots"("user_id");

-- ─── 5C: Briefs diarios ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "daily_briefs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "brief_date" date NOT NULL,
  "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "summary" text,
  "generated_by_ia" boolean NOT NULL DEFAULT false,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE("user_id", "brief_date")
);
CREATE INDEX IF NOT EXISTS "daily_briefs_user_idx" ON "daily_briefs"("user_id", "brief_date");

-- ─── 5C: Preferencias de usuario ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "brief_enabled" boolean NOT NULL DEFAULT true,
  "brief_frequency" varchar(20) NOT NULL DEFAULT 'daily',
  "brief_timezone" varchar(100) NOT NULL DEFAULT 'Europe/Madrid',
  "brief_hour" integer NOT NULL DEFAULT 8,
  "brief_scope" varchar(20) NOT NULL DEFAULT 'my_cases',
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE("user_id")
);
CREATE INDEX IF NOT EXISTS "user_preferences_user_idx" ON "user_preferences"("user_id");

-- ─── 5D: Métricas de autonomía ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "autonomy_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "metric_date" date NOT NULL,
  "level" integer NOT NULL DEFAULT 0,
  "cases_total" integer NOT NULL DEFAULT 0,
  "auto_classified" integer NOT NULL DEFAULT 0,
  "auto_reminders" integer NOT NULL DEFAULT 0,
  "proposed_actions" integer NOT NULL DEFAULT 0,
  "accepted_actions" integer NOT NULL DEFAULT 0,
  "rejected_actions" integer NOT NULL DEFAULT 0,
  "human_interventions" integer NOT NULL DEFAULT 0,
  "estimated_time_saved_minutes" integer NOT NULL DEFAULT 0,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE("organization_id", "metric_date")
);
CREATE INDEX IF NOT EXISTS "autonomy_metrics_org_idx" ON "autonomy_metrics"("organization_id");

-- ─── Seed feature flags ────────────────────────────────────────────────
INSERT INTO "feature_flags" ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en") VALUES
  ('sgie.risk.enabled', 'global', false, false, 'Fase 5A deny-by-default', now(), now()),
  ('sgie.workload.enabled', 'global', false, false, 'Fase 5A deny-by-default', now(), now()),
  ('sgie.daily_brief.enabled', 'global', false, false, 'Fase 5C deny-by-default', now(), now()),
  ('sgie.autonomy_metrics.enabled', 'global', false, false, 'Fase 5D deny-by-default', now(), now())
ON CONFLICT DO NOTHING;

-- ─── Seed capabilities ─────────────────────────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('risk', 'read', 'Consultar evaluaciones de riesgo'),
  ('workload', 'read', 'Consultar carga de trabajo'),
  ('brief', 'read', 'Consultar brief diario'),
  ('brief', 'configure', 'Configurar preferencias de brief'),
  ('metrics', 'read', 'Consultar métricas de autonomía'),
  ('portal', 'read', 'Consultar portal del cliente')
ON CONFLICT ("recurso", "accion") DO NOTHING;

INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador', 'supervisor')
  AND p.recurso IN ('risk', 'workload', 'brief', 'metrics')
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
