CREATE TYPE "public"."actor_tipo" AS ENUM('abogado', 'admin', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."asignacion_rol" AS ENUM('responsable', 'colaborador', 'supervisor');--> statement-breakpoint
CREATE TYPE "public"."expediente_estado" AS ENUM('creado', 'pendiente_de_checklist', 'pendiente_de_documentos', 'enlace_enviado', 'documentos_parcialmente_recibidos', 'documentos_completos', 'analisis_pendiente', 'analisis_completado', 'inconsistencias_detectadas', 'pendiente_validacion_abogado', 'validado', 'pendiente_de_firma', 'en_tramite', 'en_seguimiento', 'finalizado', 'archivado');--> statement-breakpoint
CREATE TYPE "public"."expediente_prioridad" AS ENUM('baja', 'media', 'alta', 'urgente');--> statement-breakpoint
CREATE TYPE "public"."procedimiento_estado" AS ENUM('borrador', 'activo', 'desactivado', 'pendiente_validacion_legal');--> statement-breakpoint
CREATE TYPE "public"."requisito_estado" AS ENUM('solicitado', 'subido', 'clasificando', 'clasificado', 'texto_extraido', 'ocr_pendiente', 'ilegible', 'duplicado', 'incorrecto', 'vencido', 'ia_procesada', 'pendiente_abogado', 'aprobado', 'rechazado');--> statement-breakpoint
CREATE TYPE "public"."requisito_tipo" AS ENUM('obligatorio', 'opcional', 'condicional');--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(300) NOT NULL,
	"identidad" varchar(50),
	"rtn" varchar(50),
	"email" varchar(255),
	"telefono" varchar(50),
	"notas" text,
	"duplicado_hash" varchar(64),
	"creado_por" uuid,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expediente_asignaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"abogado_id" uuid NOT NULL,
	"rol" "asignacion_rol" DEFAULT 'responsable' NOT NULL,
	"asignado_por" uuid,
	"asignado_en" timestamp with time zone DEFAULT now(),
	"revocada_en" timestamp with time zone,
	CONSTRAINT "expediente_asignaciones_activa_unica" UNIQUE("expediente_id","abogado_id")
);
--> statement-breakpoint
CREATE TABLE "expediente_permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"abogado_id" uuid NOT NULL,
	"tipo_permiso" varchar(50) NOT NULL,
	"concedido_por" uuid,
	"concedido_en" timestamp with time zone DEFAULT now(),
	"revocado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expedientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_interno" varchar(100) NOT NULL,
	"cliente_id" uuid,
	"tipo_procedimiento_id" uuid,
	"procedimiento_version" integer,
	"responsable_id" uuid,
	"estado" "expediente_estado" DEFAULT 'creado' NOT NULL,
	"prioridad" "expediente_prioridad" DEFAULT 'media' NOT NULL,
	"area" varchar(200),
	"resumen" text,
	"creado_por" uuid,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	"cerrado_en" timestamp with time zone,
	CONSTRAINT "expedientes_numero_interno_unique" UNIQUE("numero_interno")
);
--> statement-breakpoint
CREATE TABLE "historial_expediente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"accion" varchar(100) NOT NULL,
	"estado_anterior" varchar(50),
	"estado_nuevo" varchar(50),
	"actor_id" uuid,
	"actor_tipo" "actor_tipo" DEFAULT 'sistema' NOT NULL,
	"metadata" jsonb,
	"mensaje" text,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "requisitos_expediente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"procedimiento_requisito_key" varchar(100),
	"nombre" varchar(300) NOT NULL,
	"tipo" "requisito_tipo" DEFAULT 'obligatorio' NOT NULL,
	"estado" "requisito_estado" DEFAULT 'solicitado' NOT NULL,
	"orden" integer DEFAULT 0,
	"confirmado" boolean DEFAULT false,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tipos_procedimiento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"nombre" varchar(300) NOT NULL,
	"area_juridica" varchar(200),
	"descripcion" text,
	"version" integer DEFAULT 1 NOT NULL,
	"estado" "procedimiento_estado" DEFAULT 'pendiente_validacion_legal' NOT NULL,
	"definicion" jsonb,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "tipos_procedimiento_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usuarios_sgie" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"correo_corporativo" varchar(255),
	"activo_sgie" boolean DEFAULT true,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "ultimo_acceso" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "bloqueado" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "bloqueado_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "bloqueado_motivo" varchar(500);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "correo_corporativo_vinculado" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_asignaciones" ADD CONSTRAINT "expediente_asignaciones_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_asignaciones" ADD CONSTRAINT "expediente_asignaciones_abogado_id_usuarios_id_fk" FOREIGN KEY ("abogado_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_asignaciones" ADD CONSTRAINT "expediente_asignaciones_asignado_por_usuarios_id_fk" FOREIGN KEY ("asignado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_permisos" ADD CONSTRAINT "expediente_permisos_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_permisos" ADD CONSTRAINT "expediente_permisos_abogado_id_usuarios_id_fk" FOREIGN KEY ("abogado_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_permisos" ADD CONSTRAINT "expediente_permisos_concedido_por_usuarios_id_fk" FOREIGN KEY ("concedido_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_tipo_procedimiento_id_tipos_procedimiento_id_fk" FOREIGN KEY ("tipo_procedimiento_id") REFERENCES "public"."tipos_procedimiento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_responsable_id_usuarios_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_expediente" ADD CONSTRAINT "historial_expediente_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_expediente" ADD CONSTRAINT "historial_expediente_actor_id_usuarios_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitos_expediente" ADD CONSTRAINT "requisitos_expediente_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_sgie" ADD CONSTRAINT "usuarios_sgie_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clientes_duplicado_hash_idx" ON "clientes" USING btree ("duplicado_hash");--> statement-breakpoint
CREATE INDEX "clientes_identidad_idx" ON "clientes" USING btree ("identidad");--> statement-breakpoint
CREATE INDEX "clientes_nombre_idx" ON "clientes" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "expediente_asignaciones_expediente_idx" ON "expediente_asignaciones" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "expediente_asignaciones_abogado_idx" ON "expediente_asignaciones" USING btree ("abogado_id");--> statement-breakpoint
CREATE INDEX "expediente_permisos_expediente_idx" ON "expediente_permisos" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "expediente_permisos_abogado_idx" ON "expediente_permisos" USING btree ("abogado_id");--> statement-breakpoint
CREATE INDEX "expedientes_numero_interno_idx" ON "expedientes" USING btree ("numero_interno");--> statement-breakpoint
CREATE INDEX "expedientes_estado_idx" ON "expedientes" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "expedientes_responsable_idx" ON "expedientes" USING btree ("responsable_id");--> statement-breakpoint
CREATE INDEX "expedientes_cliente_idx" ON "expedientes" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "historial_expediente_expediente_idx" ON "historial_expediente" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "historial_expediente_creado_en_idx" ON "historial_expediente" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "requisitos_expediente_expediente_idx" ON "requisitos_expediente" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "tipos_procedimiento_slug_idx" ON "tipos_procedimiento" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tipos_procedimiento_estado_idx" ON "tipos_procedimiento" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "usuarios_bloqueado_idx" ON "usuarios" USING btree ("bloqueado");