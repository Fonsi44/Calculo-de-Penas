-- Migration 0056: Corrección de drift — columnas ai_review_* en blog_posts.
--
-- PROBLEMA QUE CORRIGE:
--   lib/schema.ts define las columnas ai_review_* del workflow de revisión IA
--   (Fase 3) en blog_posts, pero ninguna migración Drizzle las crea. Estas
--   columnas ya existen en producción (aplicadas manualmente en su momento,
--   sin migración registrada), por lo que el blog funciona allí, pero cualquier
--   base creada desde cero (como el entorno E2E staging) queda incompleta y
--   las queries fallan con "column ai_review_status does not exist".
--
-- DETECTADO POR:
--   Pipeline E2E staging del PR #20 — los specs que cargan páginas de blog
--   (navigation, smoke, hydration) fallaban por timeout al colgarse
--   getPostBySlug/getPublishedPosts.
--
-- IDEMPOTENTE: cada ADD COLUMN usa IF NOT EXISTS. Segura para re-ejecución.
-- Las columnas y sus defaults coinciden exactamente con lib/schema.ts.

ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_status" varchar(50) DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_model" varchar(100);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_version" varchar(100);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_confidence" varchar(50);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_sources" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_claims_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_confirmed_claims" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_corrected_claims" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_review_unresolved_claims" integer DEFAULT 0;
