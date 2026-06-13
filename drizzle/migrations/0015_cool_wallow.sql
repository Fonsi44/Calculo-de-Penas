ALTER TABLE "delitos" ADD COLUMN "tipo_pena_principal" varchar(50);--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "tiene_prision" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "prision_min_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "prision_max_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "prision_unidad" varchar(20) DEFAULT 'meses';--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "tiene_multa" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "multa_min_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "multa_max_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "multa_unidad" varchar(50);--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "multa_descripcion_legal" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_alternativa_tipo" varchar(50);--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_alternativa_min_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_alternativa_max_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_alternativa_unidad" varchar(20);--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "inhabilitacion_min_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "inhabilitacion_max_valor" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "inhabilitacion_unidad" varchar(50);--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "reglas_especiales_pena" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "observaciones_pena" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "estado_verificacion_pena" varchar(30) DEFAULT 'pendiente_revision';