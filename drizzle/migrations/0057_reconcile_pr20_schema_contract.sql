-- PR #20: reconciliación contractual entre canonical_pr20 y el clon productivo.
--
-- Precondiciones comprobadas de nuevo dentro de la migración:
--   * no hay NULL en las tres columnas que pasan a NOT NULL;
--   * no hay tokens de preview duplicados.
--
-- CREATE INDEX CONCURRENTLY evita bloquear escrituras durante la construcción
-- del HNSW. Por ello esta migración no debe envolverse en una transacción.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM case_readiness_checks WHERE created_at IS NULL)
     OR EXISTS (SELECT 1 FROM case_readiness_runs WHERE created_at IS NULL)
     OR EXISTS (SELECT 1 FROM document_text_pages WHERE created_at IS NULL) THEN
    RAISE EXCEPTION 'PR20 reconciliation aborted: NULL created_at values';
  END IF;
  IF EXISTS (
    SELECT token FROM preview_tokens GROUP BY token HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'PR20 reconciliation aborted: duplicate preview tokens';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE case_readiness_checks ALTER COLUMN created_at SET NOT NULL;
--> statement-breakpoint
ALTER TABLE case_readiness_runs ALTER COLUMN created_at SET NOT NULL;
--> statement-breakpoint
ALTER TABLE document_text_pages ALTER COLUMN created_at SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.preview_tokens'::regclass
      AND conname = 'preview_tokens_token_unique'
      AND contype = 'u'
  ) THEN
    ALTER TABLE preview_tokens
      ADD CONSTRAINT preview_tokens_token_unique UNIQUE (token);
  END IF;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS preview_tokens_token_idx;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS preview_tokens_token_idx ON preview_tokens (token);
--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS embeddings_vector_idx
  ON embeddings USING hnsw (embedding vector_cosine_ops);
