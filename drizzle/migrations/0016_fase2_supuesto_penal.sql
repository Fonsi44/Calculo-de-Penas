-- Fase 2: Supuesto Penal Calculable
-- Crear enum para tipo de pena
CREATE TYPE "tipo_pena" AS ENUM ('prision', 'multa', 'perpetuidad');--> statement-breakpoint

-- Crear tabla supuestos_penales
CREATE TABLE "supuestos_penales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"delito_id" uuid NOT NULL,
	"numeral" varchar(50),
	"literal" varchar(50),
	"inciso" varchar(50),
	"texto_modalidad" text,
	"pena_min_meses" integer NOT NULL,
	"pena_max_meses" integer NOT NULL,
	"tipo_pena" "tipo_pena" NOT NULL DEFAULT 'prision',
	"tiene_agravantes_especificas" boolean DEFAULT false,
	"observaciones" text,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone
);--> statement-breakpoint

-- Crear índices y FK para supuestos_penales
DO $$ BEGIN
	ALTER TABLE "supuestos_penales" ADD CONSTRAINT "supuestos_penales_delito_id_fkey" FOREIGN KEY ("delito_id") REFERENCES "delitos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "supuestos_penales_delito_idx" ON "supuestos_penales" ("delito_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supuestos_penales_numeral_literal_inciso_idx" ON "supuestos_penales" ("numeral", "literal", "inciso");--> statement-breakpoint

-- Crear tabla agravantes_especificas
CREATE TABLE "agravantes_especificas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"supuesto_penal_id" uuid NOT NULL,
	"articulo_cp" varchar(100) NOT NULL,
	"numeral" varchar(50),
	"literal" varchar(50),
	"texto_agravante" text NOT NULL,
	"fraccion_aumento" varchar(20) NOT NULL,
	"obligatoria" boolean DEFAULT false,
	"creado_en" timestamp with time zone DEFAULT now()
);--> statement-breakpoint

-- Crear índices y FK para agravantes_especificas
DO $$ BEGIN
	ALTER TABLE "agravantes_especificas" ADD CONSTRAINT "agravantes_especificas_supuesto_penal_id_fkey" FOREIGN KEY ("supuesto_penal_id") REFERENCES "supuestos_penales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "agravantes_especificas_supuesto_idx" ON "agravantes_especificas" ("supuesto_penal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agravantes_especificas_articulo_idx" ON "agravantes_especificas" ("articulo_cp");--> statement-breakpoint

-- Crear tabla remisiones_normativas
CREATE TABLE "remisiones_normativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"articulo_origen" varchar(100) NOT NULL,
	"numeral_origen" varchar(50),
	"articulo_destino" varchar(100) NOT NULL,
	"numeral_destino" varchar(50),
	"texto_remision" text NOT NULL,
	"condicion_aplicacion" text,
	"creado_en" timestamp with time zone DEFAULT now()
);--> statement-breakpoint

-- Crear índices para remisiones_normativas
CREATE INDEX IF NOT EXISTS "remisiones_articulo_origen_idx" ON "remisiones_normativas" ("articulo_origen");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "remisiones_articulo_destino_idx" ON "remisiones_normativas" ("articulo_destino");
