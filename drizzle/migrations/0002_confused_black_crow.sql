CREATE TABLE "bufetes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"resultado" jsonb NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "casos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"cliente" varchar(200),
	"estado" varchar(50) DEFAULT 'borrador' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"rol" varchar(50) DEFAULT 'abogado' NOT NULL,
	"bufete_id" uuid,
	"creado_en" timestamp with time zone DEFAULT now(),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "calculos" ADD CONSTRAINT "calculos_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casos" ADD CONSTRAINT "casos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_bufete_id_bufetes_id_fk" FOREIGN KEY ("bufete_id") REFERENCES "public"."bufetes"("id") ON DELETE no action ON UPDATE no action;