-- Migration 0040: Pipeline documental P2-01 a P2-04 (Fase 4A)
--
-- Tablas para clasificación documental con evidencia, auto-vinculación
-- reversible, extracción estructurada versionada y contradicciones. No
-- duplican lógica existente: extienden documentos_expediente y
-- campos_extraidos con metadatos de pipeline.

-- ─── Clasificación documental (P2-01) ───────────────────────────────────────
-- Registro de cada ejecución de clasificación sobre un documento. Un
-- documento puede tener múltiples ejecuciones históricas (por pipelineVersion).
CREATE TABLE IF NOT EXISTS "document_classifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "expediente_id" uuid REFERENCES "expedientes"("id") ON DELETE CASCADE,
  -- Idempotencia: un resultado vigente por (documento, pipeline_version).
  "pipeline_version" varchar(40) NOT NULL,
  "tipo_propuesto" varchar(100) NOT NULL,
  "subtipo_propuesto" varchar(100),
  "idioma" varchar(20),
  "es_compuesto_probable" boolean NOT NULL DEFAULT false,
  "expediente_probable_id" uuid REFERENCES "expedientes"("id") ON DELETE SET NULL,
  "requisito_probable_id" uuid REFERENCES "requisitos_expediente"("id") ON DELETE SET NULL,
  -- Confianza normalizada 0-100.
  "confianza" integer NOT NULL CHECK ("confianza" BETWEEN 0 AND 100),
  -- Alternativas con confianza: [{tipo, confianza}]
  "alternativas" jsonb NOT NULL DEFAULT '[]',
  "evidencias" jsonb NOT NULL DEFAULT '[]',
  -- Estrategia usada: deterministic | heuristic | deepseek | deepseek_pro | human
  "estrategia" varchar(30) NOT NULL,
  "modelo" varchar(100),
  "prompt_version" varchar(40),
  "schema_version" varchar(40) NOT NULL DEFAULT '1',
  -- Estado humano.
  "estado" varchar(30) NOT NULL DEFAULT 'propuesta'
    CHECK ("estado" IN ('propuesta','auto_aprobada','aprobada','rechazada','corregida','pendiente_revision')),
  "decision_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "decision_en" timestamptz,
  "decision_motivo" varchar(500),
  "correccion_tipo" varchar(100),
  "tokens_input" integer,
  "tokens_output" integer,
  "latencia_ms" integer,
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_classifications_doc_pipeline_unique"
  ON "document_classifications"("document_id", "pipeline_version");
CREATE INDEX IF NOT EXISTS "document_classifications_doc_idx" ON "document_classifications"("document_id");
CREATE INDEX IF NOT EXISTS "document_classifications_estado_idx" ON "document_classifications"("estado");
CREATE INDEX IF NOT EXISTS "document_classifications_confianza_idx" ON "document_classifications"("confianza");

-- ─── Vinculaciones documento-requisito (P2-02) ──────────────────────────────
-- Historial de propuestas/vinculaciones entre un documento y un requisito.
-- Reversible: el último registro vigente define el estado actual.
CREATE TABLE IF NOT EXISTS "document_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "requisito_id" uuid REFERENCES "requisitos_expediente"("id") ON DELETE SET NULL,
  -- Tipo de vínculo.
  "tipo" varchar(30) NOT NULL DEFAULT 'principal'
    CHECK ("tipo" IN ('principal','sustitucion','complementario','version')),
  -- Origen: auto (P2-02) o humano.
  "origen" varchar(20) NOT NULL DEFAULT 'auto'
    CHECK ("origen" IN ('auto','humano')),
  -- Confianza de la propuesta automática.
  "confianza" integer CHECK ("confianza" BETWEEN 0 AND 100),
  "estrategia" varchar(30),
  "explicacion" text,
  "evidencias" jsonb NOT NULL DEFAULT '[]',
  -- Estado: propuesta, aceptada, rechazada, revocada.
  "estado" varchar(30) NOT NULL DEFAULT 'propuesta'
    CHECK ("estado" IN ('propuesta','aceptada','rechazada','revocada')),
  "decision_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "decision_en" timestamptz,
  "decision_motivo" varchar(500),
  "actor_id" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "creado_en" timestamptz NOT NULL DEFAULT now(),
  "actualizado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "document_links_doc_idx" ON "document_links"("document_id");
CREATE INDEX IF NOT EXISTS "document_links_exp_idx" ON "document_links"("expediente_id");
CREATE INDEX IF NOT EXISTS "document_links_req_idx" ON "document_links"("requisito_id") WHERE "requisito_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "document_links_estado_idx" ON "document_links"("estado");

-- ─── Schemas de extracción versionados (P2-03) ──────────────────────────────
-- Catálogo de schemas por tipo documental. Cada schema define los campos
-- esperados, sus tipos y validaciones. Versionado.
CREATE TABLE IF NOT EXISTS "extraction_schema_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tipo_documento" varchar(100) NOT NULL,
  "version" integer NOT NULL,
  -- Definición: [{clave, tipo, requerido, validacion, descripcion}]
  "campos" jsonb NOT NULL DEFAULT '[]',
  "activo" boolean NOT NULL DEFAULT true,
  "creado_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "creado_en" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("tipo_documento", "version")
);

CREATE UNIQUE INDEX IF NOT EXISTS "extraction_schema_versions_tipo_activo_unique"
  ON "extraction_schema_versions"("tipo_documento") WHERE "activo" = true;
CREATE INDEX IF NOT EXISTS "extraction_schema_versions_tipo_idx" ON "extraction_schema_versions"("tipo_documento");

-- ─── Extracciones versionadas (P2-03) ───────────────────────────────────────
-- Cada ejecución de extracción sobre un documento con una versión de schema.
-- Permite re-extracción sin perder histórico.
CREATE TABLE IF NOT EXISTS "document_extractions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "schema_version_id" uuid NOT NULL REFERENCES "extraction_schema_versions"("id"),
  "pipeline_version" varchar(40) NOT NULL,
  -- Campos extraídos: [{clave, valor, tipo, pagina, fragmento, coordenadas, confianza, estado}]
  "campos" jsonb NOT NULL DEFAULT '[]',
  "estrategia" varchar(30) NOT NULL,
  "modelo" varchar(100),
  "prompt_version" varchar(40),
  -- Confianza agregada 0-100.
  "confianza" integer NOT NULL CHECK ("confianza" BETWEEN 0 AND 100),
  "estado" varchar(30) NOT NULL DEFAULT 'extraido'
    CHECK ("estado" IN ('extraido','validado','corregido','rechazado','pendiente_revision')),
  "validado_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "validado_en" timestamptz,
  "tokens_input" integer,
  "tokens_output" integer,
  "latencia_ms" integer,
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_extractions_doc_pipeline_unique"
  ON "document_extractions"("document_id", "pipeline_version");
CREATE INDEX IF NOT EXISTS "document_extractions_doc_idx" ON "document_extractions"("document_id");
CREATE INDEX IF NOT EXISTS "document_extractions_exp_idx" ON "document_extractions"("expediente_id");
CREATE INDEX IF NOT EXISTS "document_extractions_estado_idx" ON "document_extractions"("estado");

-- ─── Contradicciones (P2-04) ────────────────────────────────────────────────
-- Detección determinista o asistida por IA. Una contradicción compara
-- documentos/páginas dentro del mismo expediente.
CREATE TABLE IF NOT EXISTS "document_contradictions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  -- Tipo: fecha_incompatible, identidad_incompatible, expediente_externo_distinto,
  -- caducado, firmante_ausente, cuantia_incompatible, requisito_equivocado,
  -- duplicidad, version_inconsistente, otra.
  "tipo" varchar(60) NOT NULL,
  -- Hechos comparados A vs B.
  "hecho_a" jsonb NOT NULL,
  "hecho_b" jsonb NOT NULL,
  "document_a_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE SET NULL,
  "document_b_id" uuid REFERENCES "documentos_expediente"("id") ON DELETE SET NULL,
  "pagina_a" integer,
  "pagina_b" integer,
  "fragmento_a" text,
  "fragmento_b" text,
  -- severidad: info, advertencia, error, critico.
  "severidad" varchar(20) NOT NULL DEFAULT 'advertencia'
    CHECK ("severidad" IN ('info','advertencia','error','critico')),
  "confianza" integer NOT NULL DEFAULT 100 CHECK ("confianza" BETWEEN 0 AND 100),
  "bloqueante" boolean NOT NULL DEFAULT false,
  "explicacion" text NOT NULL,
  -- Origen: regla determinista o ejecución IA.
  "origen" varchar(20) NOT NULL DEFAULT 'determinista'
    CHECK ("origen" IN ('determinista','ia','humano')),
  "regla_id" varchar(100),
  "modelo_ia" varchar(100),
  "tokens_input" integer,
  "tokens_output" integer,
  -- Estado del flujo de resolución.
  "estado" varchar(30) NOT NULL DEFAULT 'propuesta'
    CHECK ("estado" IN ('propuesta','confirmada','rechazada','resuelta','aceptada_con_motivo')),
  "resolucion_por" uuid REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "resolucion_en" timestamptz,
  "resolucion_motivo" varchar(500),
  "creado_en" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "document_contradictions_exp_idx" ON "document_contradictions"("expediente_id");
CREATE INDEX IF NOT EXISTS "document_contradictions_estado_idx" ON "document_contradictions"("estado");
CREATE INDEX IF NOT EXISTS "document_contradictions_bloqueante_idx" ON "document_contradictions"("bloqueante") WHERE "bloqueante" = true;
CREATE INDEX IF NOT EXISTS "document_contradictions_severidad_idx" ON "document_contradictions"("severidad");
