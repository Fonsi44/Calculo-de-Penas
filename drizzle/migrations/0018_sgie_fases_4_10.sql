CREATE TYPE "public"."alerta_severidad" AS ENUM('info', 'advertencia', 'error', 'critico');--> statement-breakpoint
CREATE TYPE "public"."correo_estado" AS ENUM('pendiente', 'enviado', 'fallido', 'reintentando');--> statement-breakpoint
CREATE TYPE "public"."documento_estado" AS ENUM('solicitado', 'subido', 'clasificando', 'clasificado', 'texto_extraido', 'ocr_pendiente', 'ilegible', 'duplicado', 'incorrecto', 'vencido', 'ia_procesada', 'pendiente_abogado', 'aprobado', 'rechazado');--> statement-breakpoint
CREATE TYPE "public"."documento_origen" AS ENUM('cliente', 'abogado', 'admin', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."evento_agenda_estado" AS ENUM('propuesta', 'confirmada', 'descartada', 'completada');--> statement-breakpoint
CREATE TYPE "public"."evento_agenda_tipo" AS ENUM('interna', 'procesal_detectada', 'audiencia', 'recordatorio', 'vencimiento_enlace');--> statement-breakpoint
CREATE TYPE "public"."job_sgie_estado" AS ENUM('pendiente', 'en_proceso', 'completado', 'fallido', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."job_sgie_tipo" AS ENUM('extraccion_texto', 'clasificacion', 'ocr', 'ia_extraccion', 'reglas_ejecucion', 'confianza_calculo', 'correo_envio', 'recordatorio', 'retencion_archivado', 'limpieza');--> statement-breakpoint
CREATE TYPE "public"."plantilla_correo_estado" AS ENUM('borrador', 'activa', 'desactivada');--> statement-breakpoint
CREATE TYPE "public"."severidad" AS ENUM('info', 'advertencia', 'error', 'critico');--> statement-breakpoint
CREATE TYPE "public"."sugerencia_estado" AS ENUM('pendiente', 'aprobada', 'rechazada', 'aplicada');--> statement-breakpoint
CREATE TYPE "public"."tarea_estado" AS ENUM('pendiente', 'en_progreso', 'completada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tarea_prioridad" AS ENUM('baja', 'media', 'alta', 'urgente');--> statement-breakpoint
CREATE TABLE "alertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid,
	"documento_id" uuid,
	"tipo" varchar(100) NOT NULL,
	"severidad" "alerta_severidad" NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"mensaje" text,
	"resuelta" boolean DEFAULT false,
	"resuelta_por" uuid,
	"resuelta_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campos_extraidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"expediente_id" uuid NOT NULL,
	"clave" varchar(100) NOT NULL,
	"valor" text,
	"tipo" varchar(50),
	"confianza" integer,
	"cita_fragmento" text,
	"observaciones" text,
	"confirmado_por" uuid,
	"confirmado_en" timestamp with time zone,
	"corregido_valor" text,
	"corregido_por" uuid,
	"corregido_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "confianza_resultados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid,
	"documento_id" uuid,
	"campo_extraido_id" uuid,
	"nivel" varchar(20) NOT NULL,
	"confianza" integer NOT NULL,
	"etiqueta" varchar(20),
	"evidencias" jsonb,
	"reglas_config_version_id" uuid,
	"calculado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "correcciones_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo_extraido_id" uuid NOT NULL,
	"campo" varchar(100) NOT NULL,
	"valor_propuesto" text,
	"valor_corregido" text,
	"motivo" varchar(500),
	"documento_id" uuid,
	"abogado_id" uuid NOT NULL,
	"confianza_anterior" integer,
	"confianza_posterior" integer,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "correos_enviados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid,
	"plantilla_slug" varchar(100) NOT NULL,
	"destinatario" varchar(255) NOT NULL,
	"asunto" varchar(300) NOT NULL,
	"cuerpo_html" text NOT NULL,
	"estado" "correo_estado" DEFAULT 'pendiente' NOT NULL,
	"resend_id" varchar(255),
	"ventana_temporal" varchar(50),
	"intentos" integer DEFAULT 0,
	"error" text,
	"enviado_por" uuid,
	"enviado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "correos_enviados_idempotencia_unique" UNIQUE("expediente_id","plantilla_slug","ventana_temporal")
);
--> statement-breakpoint
CREATE TABLE "documentos_expediente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"requisito_expediente_id" uuid,
	"enlace_magico_id" uuid,
	"nombre_original" varchar(500) NOT NULL,
	"nombre_saneado" varchar(500) NOT NULL,
	"tipo_mime" varchar(100) NOT NULL,
	"tamaño_bytes" integer NOT NULL,
	"hash_sha256" varchar(64) NOT NULL,
	"blob_url" varchar(1000) NOT NULL,
	"blob_texto_url" varchar(1000),
	"estado" "documento_estado" DEFAULT 'subido' NOT NULL,
	"origen" "documento_origen" DEFAULT 'cliente' NOT NULL,
	"tipo_documento" varchar(100),
	"subido_por" uuid,
	"subido_ip" varchar(64),
	"subido_user_agent" varchar(500),
	"subido_en" timestamp with time zone DEFAULT now(),
	"procesado_en" timestamp with time zone,
	"aprobado_por" uuid,
	"aprobado_en" timestamp with time zone,
	"rechazado_por" uuid,
	"rechazado_en" timestamp with time zone,
	"rechazo_motivo" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "enlaces_magicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(128) NOT NULL,
	"expediente_id" uuid NOT NULL,
	"requisito_expediente_id" uuid,
	"cliente_email" varchar(255),
	"creado_por" uuid,
	"creado_en" timestamp with time zone DEFAULT now(),
	"expira_en" timestamp with time zone NOT NULL,
	"usos_maximos" integer DEFAULT 1,
	"usos_actuales" integer DEFAULT 0,
	"revocado_en" timestamp with time zone,
	"revocado_por" uuid,
	"revocado_motivo" varchar(500),
	CONSTRAINT "enlaces_magicos_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "eventos_agenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid,
	"tipo" "evento_agenda_tipo" NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"descripcion" text,
	"fecha" timestamp with time zone NOT NULL,
	"estado" "evento_agenda_estado" DEFAULT 'propuesta' NOT NULL,
	"origen_confianza" integer,
	"confirmada_por" uuid,
	"confirmada_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extracciones_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"proveedor" varchar(100),
	"modelo" varchar(100),
	"prompt_hash" varchar(64),
	"tokens_input" integer,
	"tokens_output" integer,
	"duracion_ms" integer,
	"exito" boolean DEFAULT true,
	"error" text,
	"resultado_json" jsonb,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs_sgie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "job_sgie_tipo" NOT NULL,
	"ref_id" uuid,
	"estado" "job_sgie_estado" DEFAULT 'pendiente' NOT NULL,
	"payload" jsonb,
	"ventana_temporal" varchar(50),
	"intentos" integer DEFAULT 0,
	"max_intentos" integer DEFAULT 3,
	"error" text,
	"procesado_en" timestamp with time zone,
	"completado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "jobs_sgie_idempotencia_unique" UNIQUE("tipo","ref_id","ventana_temporal")
);
--> statement-breakpoint
CREATE TABLE "plantillas_correo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"asunto" varchar(300) NOT NULL,
	"cuerpo_html" text NOT NULL,
	"variables_permitidas" text[] DEFAULT '{}',
	"estado" "plantilla_correo_estado" DEFAULT 'borrador' NOT NULL,
	"creado_por" uuid,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "plantillas_correo_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reglas_config_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb NOT NULL,
	"descripcion" varchar(500),
	"aprobado_por" uuid,
	"activa" boolean DEFAULT false,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "retencion_politicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"tipo_documento" varchar(100),
	"estado_expediente" varchar(50),
	"dias_conservacion" integer,
	"accion" varchar(50) DEFAULT 'archivar',
	"activa" boolean DEFAULT false,
	"aprobada_por" uuid,
	"aprobada_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sugerencias_ajuste" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"descripcion" text,
	"propuesta" jsonb,
	"backtest" jsonb,
	"estado" "sugerencia_estado" DEFAULT 'pendiente' NOT NULL,
	"aprobada_por" uuid,
	"aprobada_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid,
	"asignada_a" uuid,
	"titulo" varchar(300) NOT NULL,
	"descripcion" text,
	"estado" "tarea_estado" DEFAULT 'pendiente' NOT NULL,
	"prioridad" "tarea_prioridad" DEFAULT 'media' NOT NULL,
	"automatica" boolean DEFAULT false,
	"fecha_vencimiento" timestamp with time zone,
	"completada_en" timestamp with time zone,
	"creada_por" uuid,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "validaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"documento_id" uuid,
	"regla_id" varchar(100) NOT NULL,
	"severidad" "severidad" NOT NULL,
	"resultado" varchar(50) NOT NULL,
	"evidencias" jsonb,
	"mensaje" text,
	"ventana_temporal" varchar(50),
	"ejecutado_por" varchar(50) DEFAULT 'sistema',
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "validaciones_idempotencia_unique" UNIQUE("expediente_id","regla_id","ventana_temporal")
);
--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_resuelta_por_usuarios_id_fk" FOREIGN KEY ("resuelta_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos_extraidos" ADD CONSTRAINT "campos_extraidos_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos_extraidos" ADD CONSTRAINT "campos_extraidos_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos_extraidos" ADD CONSTRAINT "campos_extraidos_confirmado_por_usuarios_id_fk" FOREIGN KEY ("confirmado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos_extraidos" ADD CONSTRAINT "campos_extraidos_corregido_por_usuarios_id_fk" FOREIGN KEY ("corregido_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_campo_extraido_id_campos_extraidos_id_fk" FOREIGN KEY ("campo_extraido_id") REFERENCES "public"."campos_extraidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_reglas_config_version_id_reglas_config_version_id_fk" FOREIGN KEY ("reglas_config_version_id") REFERENCES "public"."reglas_config_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correcciones_ia" ADD CONSTRAINT "correcciones_ia_campo_extraido_id_campos_extraidos_id_fk" FOREIGN KEY ("campo_extraido_id") REFERENCES "public"."campos_extraidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correcciones_ia" ADD CONSTRAINT "correcciones_ia_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correcciones_ia" ADD CONSTRAINT "correcciones_ia_abogado_id_usuarios_id_fk" FOREIGN KEY ("abogado_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correos_enviados" ADD CONSTRAINT "correos_enviados_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correos_enviados" ADD CONSTRAINT "correos_enviados_enviado_por_usuarios_id_fk" FOREIGN KEY ("enviado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_requisito_expediente_id_requisitos_expediente_id_fk" FOREIGN KEY ("requisito_expediente_id") REFERENCES "public"."requisitos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_enlace_magico_id_enlaces_magicos_id_fk" FOREIGN KEY ("enlace_magico_id") REFERENCES "public"."enlaces_magicos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_subido_por_usuarios_id_fk" FOREIGN KEY ("subido_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_aprobado_por_usuarios_id_fk" FOREIGN KEY ("aprobado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_rechazado_por_usuarios_id_fk" FOREIGN KEY ("rechazado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enlaces_magicos" ADD CONSTRAINT "enlaces_magicos_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enlaces_magicos" ADD CONSTRAINT "enlaces_magicos_requisito_expediente_id_requisitos_expediente_id_fk" FOREIGN KEY ("requisito_expediente_id") REFERENCES "public"."requisitos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enlaces_magicos" ADD CONSTRAINT "enlaces_magicos_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_confirmada_por_usuarios_id_fk" FOREIGN KEY ("confirmada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracciones_ia" ADD CONSTRAINT "extracciones_ia_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantillas_correo" ADD CONSTRAINT "plantillas_correo_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reglas_config_version" ADD CONSTRAINT "reglas_config_version_aprobado_por_usuarios_id_fk" FOREIGN KEY ("aprobado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retencion_politicas" ADD CONSTRAINT "retencion_politicas_aprobada_por_usuarios_id_fk" FOREIGN KEY ("aprobada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sugerencias_ajuste" ADD CONSTRAINT "sugerencias_ajuste_aprobada_por_usuarios_id_fk" FOREIGN KEY ("aprobada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignada_a_usuarios_id_fk" FOREIGN KEY ("asignada_a") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creada_por_usuarios_id_fk" FOREIGN KEY ("creada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alertas_expediente_idx" ON "alertas" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "alertas_severidad_idx" ON "alertas" USING btree ("severidad");--> statement-breakpoint
CREATE INDEX "alertas_resuelta_idx" ON "alertas" USING btree ("resuelta");--> statement-breakpoint
CREATE INDEX "campos_extraidos_documento_idx" ON "campos_extraidos" USING btree ("documento_id");--> statement-breakpoint
CREATE INDEX "campos_extraidos_expediente_idx" ON "campos_extraidos" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "confianza_resultados_expediente_idx" ON "confianza_resultados" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "correcciones_ia_campo_extraido_idx" ON "correcciones_ia" USING btree ("campo_extraido_id");--> statement-breakpoint
CREATE INDEX "correos_enviados_expediente_idx" ON "correos_enviados" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "documentos_expediente_expediente_idx" ON "documentos_expediente" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "documentos_expediente_hash_idx" ON "documentos_expediente" USING btree ("hash_sha256");--> statement-breakpoint
CREATE INDEX "documentos_expediente_estado_idx" ON "documentos_expediente" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "enlaces_magicos_token_idx" ON "enlaces_magicos" USING btree ("token");--> statement-breakpoint
CREATE INDEX "enlaces_magicos_expediente_idx" ON "enlaces_magicos" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "eventos_agenda_expediente_idx" ON "eventos_agenda" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "eventos_agenda_fecha_idx" ON "eventos_agenda" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "extracciones_ia_documento_idx" ON "extracciones_ia" USING btree ("documento_id");--> statement-breakpoint
CREATE INDEX "jobs_sgie_estado_idx" ON "jobs_sgie" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "jobs_sgie_tipo_idx" ON "jobs_sgie" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "plantillas_correo_slug_idx" ON "plantillas_correo" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "reglas_config_version_idx" ON "reglas_config_version" USING btree ("version");--> statement-breakpoint
CREATE INDEX "sugerencias_ajuste_estado_idx" ON "sugerencias_ajuste" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "tareas_expediente_idx" ON "tareas" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "tareas_asignada_idx" ON "tareas" USING btree ("asignada_a");--> statement-breakpoint
CREATE INDEX "tareas_estado_idx" ON "tareas" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "validaciones_expediente_idx" ON "validaciones" USING btree ("expediente_id");