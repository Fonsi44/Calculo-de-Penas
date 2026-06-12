ALTER TABLE "solicitudes_consulta" ADD COLUMN "email_status" varchar(20) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "solicitudes_consulta" ADD COLUMN "email_id" varchar(255);--> statement-breakpoint
ALTER TABLE "solicitudes_consulta" ADD COLUMN "email_error" text;--> statement-breakpoint
CREATE INDEX "solicitudes_consulta_email_status_idx" ON "solicitudes_consulta" USING btree ("email_status");