CREATE TABLE "notificaciones_leidas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"notificacion_key" varchar(200) NOT NULL,
	"leida_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "notificaciones_leidas_usuario_key_unique" UNIQUE("usuario_id","notificacion_key")
);
--> statement-breakpoint
ALTER TABLE "notificaciones_leidas" ADD CONSTRAINT "notificaciones_leidas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notificaciones_leidas_usuario_idx" ON "notificaciones_leidas" USING btree ("usuario_id");