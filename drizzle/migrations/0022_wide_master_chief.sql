CREATE TABLE "two_factor_recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"code_hash" varchar(128) NOT NULL,
	"usado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "two_factor_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"secret_cifrado" text NOT NULL,
	"habilitado" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now(),
	"actualizado_en" timestamp with time zone,
	CONSTRAINT "two_factor_secrets_usuario_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "activo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "desactivado_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "desactivado_por" uuid;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "motivo_desactivacion" text;--> statement-breakpoint
ALTER TABLE "two_factor_recovery_codes" ADD CONSTRAINT "two_factor_recovery_codes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor_secrets" ADD CONSTRAINT "two_factor_secrets_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "two_factor_recovery_codes_hash_idx" ON "two_factor_recovery_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "two_factor_recovery_codes_usuario_idx" ON "two_factor_recovery_codes" USING btree ("usuario_id");--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_desactivado_por_usuarios_id_fk" FOREIGN KEY ("desactivado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;