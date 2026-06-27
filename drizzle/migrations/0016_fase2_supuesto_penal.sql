CREATE TYPE "public"."tipo_pena" AS ENUM('prision', 'multa', 'perpetuidad');--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'agravante_especifica_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'agravante_especifica_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'agravante_especifica_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'expediente_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'expediente_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'expediente_estado_changed';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'expediente_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'cliente_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'cliente_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'cliente_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'documento_uploaded';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'documento_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'documento_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'documento_ia_processed';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'enlace_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'enlace_revoked';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'enlace_used';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'magic_link_accessed';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'magic_link_expired';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tarea_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tarea_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tarea_completed';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'tarea_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'evento_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'evento_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'evento_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'nota_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'nota_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'plantilla_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'plantilla_updated';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'plantilla_deleted';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'correo_sent';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'correo_failed';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'notificacion_created';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'notificacion_read';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'validacion_aprobada';--> statement-breakpoint
ALTER TYPE "public"."auditoria_accion" ADD VALUE 'validacion_rechazada';--> statement-breakpoint
CREATE TABLE "agravantes_especificas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supuesto_penal_id" uuid NOT NULL,
	"articulo_cp" varchar(100) NOT NULL,
	"numeral" varchar(50),
	"literal" varchar(50),
	"texto_agravante" text NOT NULL,
	"fraccion_aumento" varchar(20) NOT NULL,
	"obligatoria" boolean DEFAULT false,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "remisiones_normativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"articulo_origen" varchar(100) NOT NULL,
	"numeral_origen" varchar(50),
	"articulo_destino" varchar(100) NOT NULL,
	"numeral_destino" varchar(50),
	"texto_remision" text NOT NULL,
	"condicion_aplicacion" text,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supuestos_penales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delito_id" uuid NOT NULL,
	"numeral" varchar(50),
	"literal" varchar(50),
	"inciso" varchar(50),
	"texto_modalidad" text,
	"pena_min_meses" integer NOT NULL,
	"pena_max_meses" integer NOT NULL,
	"tipo_pena" "tipo_pena" DEFAULT 'prision' NOT NULL,
	"tiene_agravantes_especificas" boolean DEFAULT false,
	"observaciones" text,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "meta_title" varchar(500);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "og_image" varchar(500);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "noindex" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "canonical_url" varchar(500);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "author_id" uuid;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "review_status" varchar(50) DEFAULT 'published';--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "reviewed_by" varchar(200);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "legal_review_notes" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "last_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "next_review_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agravantes_especificas" ADD CONSTRAINT "agravantes_especificas_supuesto_penal_id_supuestos_penales_id_fk" FOREIGN KEY ("supuesto_penal_id") REFERENCES "public"."supuestos_penales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supuestos_penales" ADD CONSTRAINT "supuestos_penales_delito_id_delitos_id_fk" FOREIGN KEY ("delito_id") REFERENCES "public"."delitos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agravantes_especificas_supuesto_idx" ON "agravantes_especificas" USING btree ("supuesto_penal_id");--> statement-breakpoint
CREATE INDEX "agravantes_especificas_articulo_idx" ON "agravantes_especificas" USING btree ("articulo_cp");--> statement-breakpoint
CREATE INDEX "remisiones_articulo_origen_idx" ON "remisiones_normativas" USING btree ("articulo_origen");--> statement-breakpoint
CREATE INDEX "remisiones_articulo_destino_idx" ON "remisiones_normativas" USING btree ("articulo_destino");--> statement-breakpoint
CREATE INDEX "supuestos_penales_delito_idx" ON "supuestos_penales" USING btree ("delito_id");--> statement-breakpoint
CREATE INDEX "supuestos_penales_numeral_literal_inciso_idx" ON "supuestos_penales" USING btree ("numeral","literal","inciso");