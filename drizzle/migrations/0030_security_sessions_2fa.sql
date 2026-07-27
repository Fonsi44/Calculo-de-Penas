-- Fase 1 de remediación de identidad: revocación de sesión y challenges MFA.
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "token_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "two_factor_challenges" (
  "jti" varchar(128) PRIMARY KEY NOT NULL,
  "usuario_id" uuid NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "creado_en" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "two_factor_challenges" ADD CONSTRAINT "two_factor_challenges_usuario_id_usuarios_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_challenges_expires_idx" ON "two_factor_challenges" ("expires_at");

-- Reversión documentada (NO ejecutable por Drizzle):
-- La reversión de esta migración requiere eliminar la tabla two_factor_challenges
-- y la columna token_version. Ver docs/security/runbook-rotacion-credenciales-fase1.md.
-- Nunca revertir en producción con datos.
