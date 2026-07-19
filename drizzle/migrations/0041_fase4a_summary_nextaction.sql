-- Migration 0041: Resúmenes incrementales (P2-05) y NextActions (P2-06)
--
-- Extiende resumenes_ia_expediente (regenerable por hash) con un watermark
-- de actividad para soportar resumen incremental real: solo cambios desde el
-- último resumen válido. NextActions es un servicio determinista primero.

-- ─── Resumen incremental (P2-05) ────────────────────────────────────────────
-- Checkpoint de actividad incluida en el último resumen. Permite calcular
-- "qué cambió desde" sin regenerar todo. Un registro por expediente.
CREATE TABLE IF NOT EXISTS "case_summary_checkpoints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL UNIQUE REFERENCES "expedientes"("id") ON DELETE CASCADE,
  -- Hash de las fuentes incluidas (documentos, campos, estados, eventos).
  "source_hash" varchar(64) NOT NULL,
  -- Watermark: timestamp del último evento/documento incluido.
  "watermark" timestamptz NOT NULL DEFAULT now(),
  -- Conteo de cambios incluidos desde el checkpoint anterior.
  "cambios_incluidos" integer NOT NULL DEFAULT 0,
  -- Detalle de cambios: [{tipo, entidad_id, descripcion, timestamp}]
  "cambios_detalle" jsonb NOT NULL DEFAULT '[]',
  -- Modelo/version del generador.
  "modelo" varchar(100),
  "pipeline_version" varchar(40) NOT NULL DEFAULT '1',
  "tokens_input" integer,
  "tokens_output" integer,
  "latencia_ms" integer,
  -- Estado: vigente o invalidado (cambió una fuente).
  "estado" varchar(20) NOT NULL DEFAULT 'vigente'
    CHECK ("estado" IN ('vigente','invalidado')),
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "case_summary_checkpoints_exp_idx" ON "case_summary_checkpoints"("expediente_id");
CREATE INDEX IF NOT EXISTS "case_summary_checkpoints_estado_idx" ON "case_summary_checkpoints"("estado");

-- Historial de resúmenes generados (audit trail). Permite ver evolución.
CREATE TABLE IF NOT EXISTS "case_summary_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "checkpoint_id" uuid REFERENCES "case_summary_checkpoints"("id") ON DELETE SET NULL,
  "source_hash" varchar(64) NOT NULL,
  "watermark" timestamptz NOT NULL,
  "cambios_incluidos" integer NOT NULL DEFAULT 0,
  "resumen" text NOT NULL,
  "diferencia_anterior" text,
  -- Separación de hechos/inferencias/sugerencias.
  "tipo_contenido" varchar(20) NOT NULL DEFAULT 'mixto'
    CHECK ("tipo_contenido" IN ('hecho','inferencia','sugerencia','referencia','mixto')),
  "modelo" varchar(100),
  "tokens_input" integer,
  "tokens_output" integer,
  "latencia_ms" integer,
  "creado_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "case_summary_history_exp_idx" ON "case_summary_history"("expediente_id");
CREATE INDEX IF NOT EXISTS "case_summary_history_creado_en_idx" ON "case_summary_history"("creado_en");

-- ─── Next actions (P2-06) ───────────────────────────────────────────────────
-- Acciones recomendadas por expediente. Deterministas primero (reglas sobre
-- workflow/readiness/alertas), IA opcional después. Una acción principal por
-- expediente + alternativas.
CREATE TABLE IF NOT EXISTS "case_next_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  -- Clave estable de la acción (ej. "completar_requisito_identificacion").
  "action_key" varchar(120) NOT NULL,
  "titulo" varchar(300) NOT NULL,
  "descripcion" text,
  "razon" text NOT NULL,
  -- prioridad: 1 (más urgente) a 5.
  "prioridad" integer NOT NULL DEFAULT 3 CHECK ("prioridad" BETWEEN 1 AND 5),
  "evidencias" jsonb NOT NULL DEFAULT '[]',
  "bloqueos" jsonb NOT NULL DEFAULT '[]',
  -- Regla que la generó (determinista) o estrategia IA.
  "regla_id" varchar(120),
  "estrategia" varchar(30) NOT NULL DEFAULT 'determinista'
    CHECK ("estrategia" IN ('determinista','ia','mixta')),
  "modelo_ia" varchar(100),
  "confianza" integer CHECK ("confianza" BETWEEN 0 AND 100),
  -- Indica si es la acción principal (una por expediente).
  "es_principal" boolean NOT NULL DEFAULT false,
  -- Vencimiento opcional.
  "expira_en" timestamptz,
  "requiere_confirmacion_humana" boolean NOT NULL DEFAULT true,
  -- Estado del ciclo de vida.
  "estado" varchar(30) NOT NULL DEFAULT 'propuesta'
    CHECK ("estado" IN ('propuesta','aceptada','rechazada','completada','expirada','sustituida')),
  "decision_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "decision_en" timestamptz,
  "decision_motivo" varchar(500),
  -- Idempotencia por expediente+action_key+source_hash.
  "idempotency_key" varchar(120),
  "source_hash" varchar(64) NOT NULL,
  "creado_en" timestamptz NOT NULL DEFAULT now(),
  "actualizado_en" timestamptz NOT NULL DEFAULT now()
);

-- Una acción vigente (no completada/expirada) por expediente+action_key.
CREATE UNIQUE INDEX IF NOT EXISTS "case_next_actions_vigente_unique"
  ON "case_next_actions"("expediente_id", "action_key") WHERE "estado" = 'propuesta';
CREATE INDEX IF NOT EXISTS "case_next_actions_exp_idx" ON "case_next_actions"("expediente_id");
CREATE INDEX IF NOT EXISTS "case_next_actions_estado_idx" ON "case_next_actions"("estado");
CREATE INDEX IF NOT EXISTS "case_next_actions_principal_idx" ON "case_next_actions"("es_principal") WHERE "es_principal" = true;
CREATE INDEX IF NOT EXISTS "case_next_actions_prioridad_idx" ON "case_next_actions"("prioridad");

-- ─── Auditoría de pipeline IA (correlation IDs) ────────────────────────────
-- Registro unificado de ejecuciones de pipeline IA (clasificación, extracción,
-- contradicción, resumen, next-action) para trazabilidad y observabilidad.
-- No duplica tablas específicas; las referencia opcionalmente.
CREATE TABLE IF NOT EXISTS "ai_pipeline_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "correlation_id" varchar(64) NOT NULL,
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "document_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  -- Tipo de tarea.
  "task_type" varchar(40) NOT NULL
    CHECK ("task_type" IN ('classification','extraction','linking','contradiction','summary','next_action','copilot')),
  "estrategia" varchar(30) NOT NULL,
  "modelo" varchar(100),
  "prompt_version" varchar(40),
  "pipeline_version" varchar(40) NOT NULL DEFAULT '1',
  -- Estado de la ejecución.
  "estado" varchar(30) NOT NULL DEFAULT 'pending'
    CHECK ("estado" IN ('pending','running','completed','failed','abstained','skipped')),
  -- Resultado sanitizado (sin documentos completos).
  "result_summary" text,
  "confianza" integer CHECK ("confianza" BETWEEN 0 AND 100),
  "tokens_input" integer,
  "tokens_output" integer,
  "latencia_ms" integer,
  "coste_estimado_usd" numeric(10,6),
  "error" text,
  -- Referencia a la entidad creada (opcional).
  "ref_table" varchar(60),
  "ref_id" uuid,
  "actor_id" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "scope_resuelto" jsonb,
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ai_pipeline_runs_corr_idx" ON "ai_pipeline_runs"("correlation_id");
CREATE INDEX IF NOT EXISTS "ai_pipeline_runs_exp_idx" ON "ai_pipeline_runs"("expediente_id") WHERE "expediente_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ai_pipeline_runs_task_idx" ON "ai_pipeline_runs"("task_type");
CREATE INDEX IF NOT EXISTS "ai_pipeline_runs_estado_idx" ON "ai_pipeline_runs"("estado");
CREATE INDEX IF NOT EXISTS "ai_pipeline_runs_creado_en_idx" ON "ai_pipeline_runs"("creado_en");
