-- Migration 0054: Fase 5B — Document Intelligence
-- Segmentation, comparison, contradiction detection
-- Idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING)

-- ─── Segmentation runs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "document_segmentation_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "documento_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "document_version_id" varchar(100),
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "provider" varchar(50),
  "model" varchar(100),
  "algorithm_version" varchar(20) NOT NULL DEFAULT '1.0',
  "input_hash" varchar(64),
  "idempotency_key" varchar(128) UNIQUE,
  "confidence" integer DEFAULT 0,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "error" text,
  "requested_by" uuid,
  "correlation_id" varchar(64),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "doc_seg_runs_exp_idx" ON "document_segmentation_runs"("expediente_id");
CREATE INDEX IF NOT EXISTS "doc_seg_runs_doc_idx" ON "document_segmentation_runs"("documento_id");
CREATE INDEX IF NOT EXISTS "doc_seg_runs_status_idx" ON "document_segmentation_runs"("status");

-- ─── Segments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "document_segments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "run_id" uuid NOT NULL REFERENCES "document_segmentation_runs"("id") ON DELETE CASCADE,
  "documento_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "start_page" integer NOT NULL,
  "end_page" integer NOT NULL,
  "suggested_type" varchar(100),
  "suggested_title" text,
  "signals" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "citations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "confidence" integer NOT NULL DEFAULT 0,
  "requires_human_review" boolean NOT NULL DEFAULT true,
  "review_status" varchar(30) NOT NULL DEFAULT 'pending',
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "corrected_start_page" integer,
  "corrected_end_page" integer,
  "corrected_type" varchar(100),
  "review_decision" varchar(30),
  "review_motivo" text,
  "segment_order" integer NOT NULL DEFAULT 0,
  "hash" varchar(64),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone,
  UNIQUE("run_id", "segment_order")
);
CREATE INDEX IF NOT EXISTS "doc_segments_run_idx" ON "document_segments"("run_id");
CREATE INDEX IF NOT EXISTS "doc_segments_doc_idx" ON "document_segments"("documento_id");
CREATE INDEX IF NOT EXISTS "doc_segments_review_idx" ON "document_segments"("review_status");

-- ─── Document comparisons ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "document_comparisons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "source_documento_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "target_documento_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "source_version_id" varchar(100),
  "target_version_id" varchar(100),
  "source_hash" varchar(64),
  "target_hash" varchar(64),
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "summary" text,
  "confidence" integer DEFAULT 0,
  "requires_human_review" boolean NOT NULL DEFAULT true,
  "provider" varchar(50),
  "model" varchar(100),
  "idempotency_key" varchar(128) UNIQUE,
  "correlation_id" varchar(64),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "doc_comp_exp_idx" ON "document_comparisons"("expediente_id");
CREATE INDEX IF NOT EXISTS "doc_comp_src_idx" ON "document_comparisons"("source_documento_id");
CREATE INDEX IF NOT EXISTS "doc_comp_tgt_idx" ON "document_comparisons"("target_documento_id");

-- ─── Comparison changes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "document_comparison_changes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "comparison_id" uuid NOT NULL REFERENCES "document_comparisons"("id") ON DELETE CASCADE,
  "change_type" varchar(50) NOT NULL,
  "page_section" varchar(100),
  "text_before" text,
  "text_after" text,
  "evidence" text,
  "importance" varchar(30) DEFAULT 'medium',
  "confidence" integer DEFAULT 0,
  "citations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "doc_changes_comp_idx" ON "document_comparison_changes"("comparison_id");

-- ─── Contradiction candidates ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "document_contradiction_candidates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "source_documento_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE SET NULL,
  "source_version_id" varchar(100),
  "source_page" integer,
  "source_excerpt" text,
  "related_documento_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE SET NULL,
  "related_version_id" varchar(100),
  "related_page" integer,
  "related_excerpt" text,
  "related_fact_id" varchar(100),
  "classification" varchar(50) NOT NULL DEFAULT 'possible_contradiction',
  "description" text,
  "confidence" integer DEFAULT 0,
  "limitations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "review_status" varchar(30) NOT NULL DEFAULT 'pending',
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "review_decision" varchar(30),
  "review_motivo" text,
  "comparison_id" uuid REFERENCES "document_comparisons"("id") ON DELETE SET NULL,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "doc_contra_exp_idx" ON "document_contradiction_candidates"("expediente_id");
CREATE INDEX IF NOT EXISTS "doc_contra_review_idx" ON "document_contradiction_candidates"("review_status");
CREATE INDEX IF NOT EXISTS "doc_contra_class_idx" ON "document_contradiction_candidates"("classification");

-- ─── Seed capabilities ───────────────────────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('document_intelligence', 'read', 'Consultar inteligencia documental'),
  ('document_intelligence', 'run', 'Ejecutar análisis documental'),
  ('document_intelligence', 'review', 'Revisar segmentos y comparaciones'),
  ('document_intelligence', 'confirm', 'Confirmar segmentación y contradicciones'),
  ('document_intelligence', 'manage', 'Gestionar configuración de inteligencia documental')
ON CONFLICT ("recurso", "accion") DO NOTHING;

INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador', 'supervisor')
  AND p.recurso = 'document_intelligence'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

-- ─── Seed feature flags ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key='sgie.document_segmentation.enabled' AND scope_level='global') THEN
    INSERT INTO "feature_flags" ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
    VALUES ('sgie.document_segmentation.enabled', 'global', false, false, 'Fase 5B deny-by-default', now(), now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key='sgie.document_comparison.enabled' AND scope_level='global') THEN
    INSERT INTO "feature_flags" ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
    VALUES ('sgie.document_comparison.enabled', 'global', false, false, 'Fase 5B deny-by-default', now(), now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key='sgie.document_contradictions.enabled' AND scope_level='global') THEN
    INSERT INTO "feature_flags" ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
    VALUES ('sgie.document_contradictions.enabled', 'global', false, false, 'Fase 5B deny-by-default', now(), now());
  END IF;
END $$;
