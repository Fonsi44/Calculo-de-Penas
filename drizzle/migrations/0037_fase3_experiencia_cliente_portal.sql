-- Migration 0037: Phase 3 — Customer experience portal, SLA alerts, communications rules, audit

-- 1. Alertas SLA (Service Level Agreement tracking)
CREATE TABLE IF NOT EXISTS "alertas_sla" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tipo" varchar(100) NOT NULL,
  "severidad" varchar(30) NOT NULL DEFAULT 'info',
  "titulo" varchar(300) NOT NULL,
  "mensaje" text,
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "propietario_id" uuid REFERENCES "usuarios"("id"),
  "vencimiento" timestamp with time zone,
  "estado" varchar(30) NOT NULL DEFAULT 'activa',
  "resuelta_por" uuid REFERENCES "usuarios"("id"),
  "resuelta_en" timestamp with time zone,
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "alertas_sla_expediente_idx" ON "alertas_sla"("expediente_id");
CREATE INDEX IF NOT EXISTS "alertas_sla_propietario_idx" ON "alertas_sla"("propietario_id");
CREATE INDEX IF NOT EXISTS "alertas_sla_estado_idx" ON "alertas_sla"("estado");
CREATE INDEX IF NOT EXISTS "alertas_sla_severidad_idx" ON "alertas_sla"("severidad");
CREATE INDEX IF NOT EXISTS "alertas_sla_vencimiento_idx" ON "alertas_sla"("vencimiento");

-- 2. Inbound Messages (incoming emails from clients/third parties)
CREATE TABLE IF NOT EXISTS "inbound_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" varchar(255) NOT NULL,
  "from_email" varchar(255) NOT NULL,
  "to_email" varchar(255) NOT NULL,
  "subject" varchar(500),
  "body_text" text,
  "body_html" text,
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE SET NULL,
  "requisito_id" uuid REFERENCES "requisitos_expediente"("id") ON DELETE SET NULL,
  "documento_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE SET NULL,
  "estado" varchar(30) NOT NULL DEFAULT 'recibido',
  "procesado_en" timestamp with time zone,
  "error" text,
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "inbound_messages_message_id_idx" ON "inbound_messages"("message_id");
CREATE INDEX IF NOT EXISTS "inbound_messages_expediente_idx" ON "inbound_messages"("expediente_id");
CREATE INDEX IF NOT EXISTS "inbound_messages_estado_idx" ON "inbound_messages"("estado");
CREATE INDEX IF NOT EXISTS "inbound_messages_from_idx" ON "inbound_messages"("from_email");
CREATE UNIQUE INDEX IF NOT EXISTS "inbound_messages_message_id_unique" ON "inbound_messages"("message_id");

-- 3. Portal Sessions (client portal access tracking)
CREATE TABLE IF NOT EXISTS "portal_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token_hash" varchar(64) NOT NULL,
  "enlace_id" uuid REFERENCES "enlaces_magicos"("id") ON DELETE CASCADE,
  "cliente_email" varchar(255),
  "ultimo_acceso" timestamp with time zone,
  "expira_en" timestamp with time zone NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "portal_sessions_token_hash_idx" ON "portal_sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "portal_sessions_enlace_idx" ON "portal_sessions"("enlace_id");
CREATE INDEX IF NOT EXISTS "portal_sessions_cliente_email_idx" ON "portal_sessions"("cliente_email");
CREATE INDEX IF NOT EXISTS "portal_sessions_expira_idx" ON "portal_sessions"("expira_en");

-- 4. Communication Rules (business rules for automated communications)
CREATE TABLE IF NOT EXISTS "communication_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" varchar(300) NOT NULL,
  "slug" varchar(200) NOT NULL,
  "disparador" varchar(100) NOT NULL,
  "condiciones" jsonb DEFAULT '{}',
  "destinatario" varchar(255) NOT NULL,
  "plantilla_slug" varchar(100),
  "retraso_minutos" integer DEFAULT 0,
  "horario_inicio" time,
  "horario_fin" time,
  "cadencia_horas" integer,
  "maximo_envio" integer DEFAULT 1,
  "cancelacion_si" jsonb DEFAULT '[]',
  "sensibilidad" varchar(30) DEFAULT 'normal',
  "requiere_aprobacion" boolean NOT NULL DEFAULT false,
  "idioma" varchar(10) DEFAULT 'es',
  "escalado" jsonb DEFAULT '[]',
  "estado" varchar(30) NOT NULL DEFAULT 'borrador',
  "version" integer NOT NULL DEFAULT 1,
  "creado_por" uuid REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone DEFAULT now(),
  "actualizado_en" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "communication_rules_slug_unique" ON "communication_rules"("slug");
CREATE INDEX IF NOT EXISTS "communication_rules_disparador_idx" ON "communication_rules"("disparador");
CREATE INDEX IF NOT EXISTS "communication_rules_estado_idx" ON "communication_rules"("estado");
CREATE INDEX IF NOT EXISTS "communication_rules_creado_por_idx" ON "communication_rules"("creado_por");

-- 5. Workflow Snapshots (snapshot of workflow state at a point in time)
CREATE TABLE IF NOT EXISTS "workflow_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "procedimiento_version_id" uuid REFERENCES "procedimiento_versiones"("id") ON DELETE SET NULL,
  "snapshot" jsonb NOT NULL DEFAULT '{}',
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "workflow_snapshots_expediente_idx" ON "workflow_snapshots"("expediente_id");
CREATE INDEX IF NOT EXISTS "workflow_snapshots_version_idx" ON "workflow_snapshots"("procedimiento_version_id");

-- 6. User Activity Log (granular activity tracking)
CREATE TABLE IF NOT EXISTS "user_activity_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuario_id" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "tipo" varchar(100) NOT NULL,
  "recurso" varchar(100),
  "recurso_id" varchar(100),
  "metadata" jsonb DEFAULT '{}',
  "creado_en" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "user_activity_log_usuario_idx" ON "user_activity_log"("usuario_id");
CREATE INDEX IF NOT EXISTS "user_activity_log_tipo_idx" ON "user_activity_log"("tipo");
CREATE INDEX IF NOT EXISTS "user_activity_log_creado_en_idx" ON "user_activity_log"("creado_en");
CREATE INDEX IF NOT EXISTS "user_activity_log_recurso_idx" ON "user_activity_log"("recurso", "recurso_id");
