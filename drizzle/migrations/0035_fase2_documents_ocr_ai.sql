-- Migration 0035: Phase 2 — OCR results, AI task routing, document pipeline status

-- 1. OCR Resultados
CREATE TABLE IF NOT EXISTS "ocr_resultados" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "documento_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "texto_extraido" text NOT NULL,
  "metodo" varchar(50) NOT NULL DEFAULT 'tesseract',
  "confianza" real,
  "paginas" integer,
  "duracion_ms" integer,
  "modelo_ocr" varchar(100),
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ocr_resultados_documento_idx" ON "ocr_resultados"("documento_id");

-- 2. AI Task Routing
CREATE TABLE IF NOT EXISTS "ai_task_routing" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "documento_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "task_type" varchar(100) NOT NULL,
  "proveedor_asignado" varchar(100),
  "modelo" varchar(100),
  "estado" varchar(30) NOT NULL DEFAULT 'pending',
  "payload" jsonb,
  "resultado" jsonb,
  "asignado_en" timestamp with time zone DEFAULT now(),
  "completado_en" timestamp with time zone,
  "error" text,
  "revisado_por" uuid REFERENCES "usuarios"("id"),
  "revisado_en" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "ai_task_routing_documento_idx" ON "ai_task_routing"("documento_id");
CREATE INDEX IF NOT EXISTS "ai_task_routing_estado_idx" ON "ai_task_routing"("estado");

-- 3. Add pipeline tracking to documentos_expediente
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "pipeline_status" varchar(30) DEFAULT 'pending';
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "pipeline_error" text;
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "ocr_required" boolean NOT NULL DEFAULT false;
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "ocr_completed" boolean NOT NULL DEFAULT false;
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "ai_required" boolean NOT NULL DEFAULT true;
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "ai_completed" boolean NOT NULL DEFAULT false;
ALTER TABLE "documentos_expediente" ADD COLUMN IF NOT EXISTS "correlation_id" varchar(100);

CREATE INDEX IF NOT EXISTS "documentos_correlation_idx" ON "documentos_expediente"("correlation_id");

-- 4. Add OCR fields to document_text_pages
ALTER TABLE "document_text_pages" ADD COLUMN IF NOT EXISTS "ocr_provider" varchar(50);
ALTER TABLE "document_text_pages" ADD COLUMN IF NOT EXISTS "ocr_confidence" real;
ALTER TABLE "document_text_pages" ADD COLUMN IF NOT EXISTS "rotation" integer;
ALTER TABLE "document_text_pages" ADD COLUMN IF NOT EXISTS "illegible" boolean NOT NULL DEFAULT false;
