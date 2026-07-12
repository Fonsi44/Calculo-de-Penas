-- Phase 2 — Preview tokens: almacenamiento server-side de previews (reemplaza JWT en URL).
-- Tokens opacos, de un solo uso, expiración 1h. El contenido se sanitiza con allowlist estricta.
CREATE TABLE IF NOT EXISTS "preview_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" varchar(128) NOT NULL,
  "title" varchar(500) NOT NULL,
  "body" text NOT NULL,
  "category" varchar(100) DEFAULT 'derecho-penal',
  "slug" varchar(300) DEFAULT 'preview',
  "description" text DEFAULT '',
  "created_by" uuid NOT NULL,
  "consumed_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "preview_tokens" ADD CONSTRAINT "preview_tokens_created_by_usuarios_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "preview_tokens_token_idx" ON "preview_tokens" ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "preview_tokens_expires_idx" ON "preview_tokens" ("expires_at");

-- DOWN: eliminar tabla e índices.
-- >><down>
DROP INDEX IF EXISTS "preview_tokens_expires_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "preview_tokens_token_idx";
--> statement-breakpoint
ALTER TABLE "preview_tokens" DROP CONSTRAINT IF EXISTS "preview_tokens_created_by_usuarios_id_fk";
--> statement-breakpoint
DROP TABLE IF EXISTS "preview_tokens";
