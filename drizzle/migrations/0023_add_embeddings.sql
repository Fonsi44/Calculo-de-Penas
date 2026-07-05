CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidad_tipo" varchar(50) NOT NULL,
	"entidad_id" varchar(255) NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"contenido" text NOT NULL,
	"embedding" vector(1536),
	"modelo" varchar(50) DEFAULT 'deepseek-embedding' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "embeddings_entidad_idx" ON "embeddings" USING btree ("entidad_tipo","entidad_id");
--> statement-breakpoint
-- Índice único para upsert (ON CONFLICT DO UPDATE)
CREATE UNIQUE INDEX "embeddings_unique_idx" ON "embeddings" USING btree ("entidad_tipo","entidad_id","chunk_index");
--> statement-breakpoint
-- Índice HNSW para búsqueda vectorial por similitud coseno (pgvector)
-- Este índice acelera las consultas ORDER BY embedding <=> $vector LIMIT k
CREATE INDEX "embeddings_vector_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);