-- Migration 0039: Feature flags y kill switches (Fase 4A, §21 y §6 del prompt)
--
-- Sistema de flags servidor con precedencia (global > organización > equipo >
-- usuario > expediente > procedimiento), deny-by-default, kill switch
-- inmediato, historial de cambios con auditoría y soporte de valor JSON para
-- configuraciones complejas (umbrales, modelos, etc.).
--
-- Idempotente: todas las sentencias usan IF NOT EXISTS.

-- Estado vigente de cada flag por scope. La precedencia la resuelve el
-- FeatureFlagService en servidor consultando desde el scope más específico
-- hacia el más general.
CREATE TABLE IF NOT EXISTS "feature_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clave estable del flag, ej. "sgie.ai.classification".
  "flag_key" varchar(100) NOT NULL,
  -- Nivel de scope. La resolución va de específico a general.
  "scope_level" varchar(30) NOT NULL CHECK (
    "scope_level" IN ('global','organizacion','equipo','usuario','expediente','procedimiento')
  ),
  -- IDs opcionales según scope_level. NULL para global.
  "organization_id" uuid,
  "team_id" uuid,
  "user_id" uuid REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "case_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "procedure_id" uuid REFERENCES "tipos_procedimiento"("id") ON DELETE CASCADE,
  -- Valor: bool directo (enabled) o config JSON para umbrales/modelos.
  "enabled" boolean NOT NULL DEFAULT false,
  "config" jsonb NOT NULL DEFAULT '{}',
  -- Kill switch: si true, fuerza disabled con prioridad absoluta sobre
  -- cualquier override. Solo lo activa un admin en una emergencia.
  "kill_switch" boolean NOT NULL DEFAULT false,
  -- Vigencia opcional (ventana temporal).
  "valid_from" timestamptz,
  "valid_until" timestamptz,
  "motivo" varchar(500),
  "actor_id" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "creado_en" timestamptz NOT NULL DEFAULT now(),
  "actualizado_en" timestamptz NOT NULL DEFAULT now()
);

-- Un solo estado vigente por (flag_key, scope_level, IDs). El último en
-- escribir gana; el historial audita los cambios.
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_scope_unique"
  ON "feature_flags"("flag_key", "scope_level", COALESCE("organization_id", '00000000-0000-0000-0000-000000000000'),
    COALESCE("team_id", '00000000-0000-0000-0000-000000000000'),
    COALESCE("user_id", '00000000-0000-0000-0000-000000000000'),
    COALESCE("case_id", '00000000-0000-0000-0000-000000000000'),
    COALESCE("procedure_id", '00000000-0000-0000-0000-000000000000'));

CREATE INDEX IF NOT EXISTS "feature_flags_key_idx" ON "feature_flags"("flag_key");
CREATE INDEX IF NOT EXISTS "feature_flags_scope_idx" ON "feature_flags"("scope_level");
CREATE INDEX IF NOT EXISTS "feature_flags_case_idx" ON "feature_flags"("case_id") WHERE "case_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "feature_flags_user_idx" ON "feature_flags"("user_id") WHERE "user_id" IS NOT NULL;

-- Historial inmutable de cambios (append-only). Auditoría completa.
CREATE TABLE IF NOT EXISTS "feature_flag_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "flag_key" varchar(100) NOT NULL,
  "scope_level" varchar(30) NOT NULL,
  "organization_id" uuid,
  "team_id" uuid,
  "user_id" uuid,
  "case_id" uuid,
  "procedure_id" uuid,
  "previous_enabled" boolean,
  "new_enabled" boolean NOT NULL,
  "previous_config" jsonb,
  "new_config" jsonb,
  "kill_switch" boolean NOT NULL DEFAULT false,
  "motivo" varchar(500),
  "actor_id" uuid,
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "feature_flag_history_key_idx" ON "feature_flag_history"("flag_key");
CREATE INDEX IF NOT EXISTS "feature_flag_history_creado_en_idx" ON "feature_flag_history"("creado_en");
CREATE INDEX IF NOT EXISTS "feature_flag_history_actor_idx" ON "feature_flag_history"("actor_id") WHERE "actor_id" IS NOT NULL;
