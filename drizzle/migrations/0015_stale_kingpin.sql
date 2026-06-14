ALTER TABLE "delitos" ADD COLUMN "pena_por_remision_normativa" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "articulos_remitidos_para_pena" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_base_resuelta_desde_articulo" varchar(200);--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "condicion_para_aplicar_pena_remitida" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "agravacion_por_articulo_remitido" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "formula_calculo_remision" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "requiere_datos_economicos" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "variables_necesarias_para_calculo" text;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_resuelta_min_meses" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "pena_resuelta_max_meses" integer;--> statement-breakpoint
ALTER TABLE "delitos" ADD COLUMN "observaciones_remision_normativa" text;