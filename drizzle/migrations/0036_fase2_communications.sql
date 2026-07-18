-- Migration 0036: Phase 2 — Communications, template versions, delivery tracking, audit

-- 1. Plantilla Correo Versiones (versioned email templates)
CREATE TABLE IF NOT EXISTS "plantilla_correo_versiones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "plantilla_correo_id" uuid NOT NULL REFERENCES "plantillas_correo"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "asunto" varchar(300) NOT NULL,
  "cuerpo_html" text NOT NULL,
  "variables_permitidas" text[] DEFAULT '{}',
  "creado_por" uuid REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "plantilla_correo_versiones_plantilla_idx" ON "plantilla_correo_versiones"("plantilla_correo_id");
CREATE UNIQUE INDEX IF NOT EXISTS "plantilla_correo_versiones_version_unique" ON "plantilla_correo_versiones"("plantilla_correo_id", "version");

-- 2. Add delivery tracking and correlation to correos_enviados
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "delivery_status" varchar(30);
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "bounced" boolean NOT NULL DEFAULT false;
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "bounce_type" varchar(50);
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "bounce_reason" text;
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "complaint" boolean NOT NULL DEFAULT false;
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "opened_at" timestamp with time zone;
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "clicked_at" timestamp with time zone;
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "suppressed" boolean NOT NULL DEFAULT false;
ALTER TABLE "correos_enviados" ADD COLUMN IF NOT EXISTS "correlation_id" varchar(100);

CREATE INDEX IF NOT EXISTS "correos_enviados_delivery_status_idx" ON "correos_enviados"("delivery_status");
CREATE INDEX IF NOT EXISTS "correos_enviados_bounced_idx" ON "correos_enviados"("bounced");
CREATE INDEX IF NOT EXISTS "correos_enviados_correlation_idx" ON "correos_enviados"("correlation_id");
CREATE INDEX IF NOT EXISTS "correos_enviados_suppressed_idx" ON "correos_enviados"("suppressed");

-- 3. Add template metadata to plantillas_correo
ALTER TABLE "plantillas_correo" ADD COLUMN IF NOT EXISTS "categoria" varchar(50) DEFAULT 'general';
ALTER TABLE "plantillas_correo" ADD COLUMN IF NOT EXISTS "requiere_aprobacion" boolean NOT NULL DEFAULT false;
ALTER TABLE "plantillas_correo" ADD COLUMN IF NOT EXISTS "nivel_aprobacion" varchar(20) DEFAULT 'ninguno';

-- 4. Add fields to comunicaciones_outbox (if table was created by 0034)
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "suppressed" boolean NOT NULL DEFAULT false;
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "notas" text;
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "resend_id" varchar(255);
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "aprobacion_requerida" boolean NOT NULL DEFAULT false;
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "aprobada_por" uuid REFERENCES "usuarios"("id");
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "aprobada_en" timestamp with time zone;
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "correlation_id" varchar(64);
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "cliente_id" uuid REFERENCES "clientes"("id") ON DELETE SET NULL;
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "plantilla_slug" varchar(100);
ALTER TABLE "comunicaciones_outbox" ADD COLUMN IF NOT EXISTS "variables" jsonb DEFAULT '{}';

-- 5. Comunicaciones Auditoría (audit trail for communications)
CREATE TABLE IF NOT EXISTS "comunicaciones_auditoria" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "comunicacion_id" uuid REFERENCES "comunicaciones_outbox"("id") ON DELETE SET NULL,
  "accion" varchar(100) NOT NULL,
  "estado_anterior" varchar(30),
  "estado_nuevo" varchar(30),
  "metadata" jsonb,
  "actor_id" uuid REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "comunicaciones_auditoria_comunicacion_idx" ON "comunicaciones_auditoria"("comunicacion_id");
CREATE INDEX IF NOT EXISTS "comunicaciones_auditoria_accion_idx" ON "comunicaciones_auditoria"("accion");
CREATE INDEX IF NOT EXISTS "comunicaciones_auditoria_creado_en_idx" ON "comunicaciones_auditoria"("creado_en");
