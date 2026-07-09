-- Migración 0027 — Fase 3 MVP: extracción documental por página + auditoría.
--
-- OBJETIVO: guardar el texto extraído POR PÁGINA de cada documento (para
-- revisión asistente página a página) y registrar eventos de auditoría del
-- pipeline de extracción (inicio, completado, fallo, requiere OCR, reintento,
-- revisión manual). Sin IA; solo extracción de texto (PDF digital) y OCR
-- externo cuando esté configurado.
--
-- No toca migraciones 0025 ni 0026.

-- Eventos de auditoría del pipeline de extracción (Fase 3).
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'document_extraction_started';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'document_extraction_completed';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'document_extraction_failed';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'document_requires_ocr';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'document_extraction_retried';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'document_manual_reviewed';
--> statement-breakpoint
-- Texto extraído por página de cada documento.
CREATE TABLE IF NOT EXISTS "document_text_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"extraction_id" uuid,
	"page_number" integer NOT NULL,
	"text" text NOT NULL,
	"method" varchar(30) DEFAULT 'pdf_text' NOT NULL,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_text_pages" ADD CONSTRAINT "document_text_pages_documento_id_documentos_expediente_id_fk"
  FOREIGN KEY ("documento_id") REFERENCES "documentos_expediente"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "document_text_pages" ADD CONSTRAINT "document_text_pages_extraction_id_extracciones_ia_id_fk"
  FOREIGN KEY ("extraction_id") REFERENCES "extracciones_ia"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_text_pages_documento_idx" ON "document_text_pages" ("documento_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "document_text_pages_documento_pagina_unique"
  ON "document_text_pages" ("documento_id", "page_number");
