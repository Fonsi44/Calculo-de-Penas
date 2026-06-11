CREATE TABLE "solicitudes_consulta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"telefono" varchar(50) NOT NULL,
	"email" varchar(255),
	"motivo" varchar(100) NOT NULL,
	"resumen" text NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "solicitudes_consulta_creado_en_idx" ON "solicitudes_consulta" USING btree ("creado_en");