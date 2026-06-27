ALTER TABLE "alertas" DROP CONSTRAINT "alertas_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "alertas" DROP CONSTRAINT "alertas_documento_id_documentos_expediente_id_fk";
--> statement-breakpoint
ALTER TABLE "campos_extraidos" DROP CONSTRAINT "campos_extraidos_documento_id_documentos_expediente_id_fk";
--> statement-breakpoint
ALTER TABLE "campos_extraidos" DROP CONSTRAINT "campos_extraidos_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "confianza_resultados" DROP CONSTRAINT "confianza_resultados_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "confianza_resultados" DROP CONSTRAINT "confianza_resultados_documento_id_documentos_expediente_id_fk";
--> statement-breakpoint
ALTER TABLE "confianza_resultados" DROP CONSTRAINT "confianza_resultados_campo_extraido_id_campos_extraidos_id_fk";
--> statement-breakpoint
ALTER TABLE "correcciones_ia" DROP CONSTRAINT "correcciones_ia_campo_extraido_id_campos_extraidos_id_fk";
--> statement-breakpoint
ALTER TABLE "correcciones_ia" DROP CONSTRAINT "correcciones_ia_documento_id_documentos_expediente_id_fk";
--> statement-breakpoint
ALTER TABLE "correos_enviados" DROP CONSTRAINT "correos_enviados_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "documentos_expediente" DROP CONSTRAINT "documentos_expediente_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "enlaces_magicos" DROP CONSTRAINT "enlaces_magicos_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "eventos_agenda" DROP CONSTRAINT "eventos_agenda_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "extracciones_ia" DROP CONSTRAINT "extracciones_ia_documento_id_documentos_expediente_id_fk";
--> statement-breakpoint
ALTER TABLE "tareas" DROP CONSTRAINT "tareas_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "validaciones" DROP CONSTRAINT "validaciones_expediente_id_expedientes_id_fk";
--> statement-breakpoint
ALTER TABLE "validaciones" DROP CONSTRAINT "validaciones_documento_id_documentos_expediente_id_fk";
--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos_extraidos" ADD CONSTRAINT "campos_extraidos_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos_extraidos" ADD CONSTRAINT "campos_extraidos_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confianza_resultados" ADD CONSTRAINT "confianza_resultados_campo_extraido_id_campos_extraidos_id_fk" FOREIGN KEY ("campo_extraido_id") REFERENCES "public"."campos_extraidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correcciones_ia" ADD CONSTRAINT "correcciones_ia_campo_extraido_id_campos_extraidos_id_fk" FOREIGN KEY ("campo_extraido_id") REFERENCES "public"."campos_extraidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correcciones_ia" ADD CONSTRAINT "correcciones_ia_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correos_enviados" ADD CONSTRAINT "correos_enviados_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos_expediente" ADD CONSTRAINT "documentos_expediente_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enlaces_magicos" ADD CONSTRAINT "enlaces_magicos_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracciones_ia" ADD CONSTRAINT "extracciones_ia_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_expediente_id_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_documento_id_documentos_expediente_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_expediente"("id") ON DELETE cascade ON UPDATE no action;