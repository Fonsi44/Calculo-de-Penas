CREATE INDEX "calculos_caso_idx" ON "calculos" USING btree ("caso_id");--> statement-breakpoint
CREATE INDEX "calculos_creado_en_idx" ON "calculos" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "casos_usuario_idx" ON "casos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "casos_creado_en_idx" ON "casos" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "delitos_rama_idx" ON "delitos" USING btree ("rama_id");--> statement-breakpoint
CREATE INDEX "delitos_nombre_idx" ON "delitos" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "delitos_articulo_idx" ON "delitos" USING btree ("articulo");