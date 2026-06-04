CREATE TABLE "aceptaciones_legales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"version" varchar(20) NOT NULL,
	"aceptado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "aceptacion_unique" UNIQUE("usuario_id","version")
);
--> statement-breakpoint
ALTER TABLE "aceptaciones_legales" ADD CONSTRAINT "aceptaciones_legales_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;