-- Migración 0025 — enlaces_magicos: token en claro → token_hash (SHA-256).
--
-- OBJETIVO: cerrar el gap de seguridad de la Fase 1 MVP. Los magic links NO
-- pueden almacenarse ni buscarse en claro. A partir de aquí solo se persiste
-- su hash SHA-256 (hex, 64 chars). El token en claro solo vive en memoria en
-- el momento de emisión (email/respuesta al abogado) y viaja en la URL
-- /cargar/{token} como credencial del cliente.
--
-- CONSECUENCIA: los enlaces previos almacenados en claro NO son hasheables de
-- forma verificable cara al cliente (no se puede recuperar el token original
-- ni garantizar que no haya sido comprometido). Por seguridad se REVOCAN
-- TODOS los enlaces activos. Los clientes con enlaces pendientes deberán
-- recibir uno nuevo emitido por el abogado. Esta invalidación es intencionada
-- y definitiva; no es reversible.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
ALTER TABLE "enlaces_magicos" ADD COLUMN "token_hash" varchar(64);
--> statement-breakpoint
-- Revocar TODOS los enlaces previos (almacenados en claro = no fiables).
UPDATE "enlaces_magicos"
  SET "revocado_en" = now(),
      "revocado_motivo" = 'invalidado por migración a token_hash (Fase 1)'
  WHERE "revocado_en" IS NULL;
--> statement-breakpoint
ALTER TABLE "enlaces_magicos" DROP COLUMN "token";
--> statement-breakpoint
ALTER TABLE "enlaces_magicos" ALTER COLUMN "token_hash" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "enlaces_magicos_token_hash_unique" ON "enlaces_magicos" USING btree ("token_hash");
--> statement-breakpoint
DROP INDEX IF EXISTS "enlaces_magicos_token_idx";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enlaces_magicos_token_hash_idx" ON "enlaces_magicos" USING btree ("token_hash");
