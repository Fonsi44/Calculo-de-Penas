CREATE TYPE "public"."auditoria_accion" AS ENUM('login', 'logout', 'login_failed', 'caso_created', 'caso_updated', 'caso_deleted', 'calculo_created', 'calculo_deleted', 'delito_created', 'delito_updated', 'delito_deleted', 'rate_limited', 'unauthorized_access');--> statement-breakpoint
CREATE TABLE "auditoria_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"accion" "auditoria_accion" NOT NULL,
	"recurso" varchar(100),
	"recurso_id" varchar(100),
	"ip" varchar(64),
	"user_agent" varchar(500),
	"metadata" jsonb,
	"exito" boolean DEFAULT true NOT NULL,
	"mensaje" text,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "auditoria_eventos" ADD CONSTRAINT "auditoria_eventos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auditoria_accion_idx" ON "auditoria_eventos" USING btree ("accion");--> statement-breakpoint
CREATE INDEX "auditoria_usuario_idx" ON "auditoria_eventos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "auditoria_creado_en_idx" ON "auditoria_eventos" USING btree ("creado_en");