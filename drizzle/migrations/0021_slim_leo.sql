CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now(),
	"expira_en" timestamp with time zone NOT NULL,
	"consumido_en" timestamp with time zone,
	CONSTRAINT "password_reset_tokens_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "resumenes_ia_expediente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expediente_id" uuid NOT NULL,
	"resumen" text NOT NULL,
	"proveedor" varchar(50) NOT NULL,
	"modelo" varchar(100) NOT NULL,
	"generado_por" uuid NOT NULL,
	"generado_en" timestamp with time zone DEFAULT now(),
	"hash_entrada" varchar(64) NOT NULL,
	"confianza" integer DEFAULT 0,
	"tokens_input" integer,
	"tokens_output" integer,
	"metadata" jsonb,
	CONSTRAINT "resumenes_ia_expediente_exp_unique" UNIQUE("expediente_id")
);
--> statement-breakpoint
CREATE TABLE "tarea_comentarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarea_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"comentario" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now(),
	"editado_en" timestamp with time zone,
	"eliminado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumenes_ia_expediente" ADD CONSTRAINT "resumenes_ia_expediente_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumenes_ia_expediente" ADD CONSTRAINT "resumenes_ia_expediente_generado_por_usuarios_id_fk" FOREIGN KEY ("generado_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_comentarios" ADD CONSTRAINT "tarea_comentarios_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_comentarios" ADD CONSTRAINT "tarea_comentarios_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_reset_tokens_usuario_idx" ON "password_reset_tokens" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "resumenes_ia_expediente_exp_idx" ON "resumenes_ia_expediente" USING btree ("expediente_id");--> statement-breakpoint
CREATE INDEX "tarea_comentarios_tarea_idx" ON "tarea_comentarios" USING btree ("tarea_id");