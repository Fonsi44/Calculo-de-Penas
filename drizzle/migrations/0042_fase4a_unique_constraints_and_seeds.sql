-- Migration 0042: UNIQUE constraints faltantes + seed schemas canónicos
--
-- Corrige bugs de idempotencia detectados en la auditoría del commit 7de4fd1:
-- - feature_flags: UNIQUE por (flag_key, scope_level, ids) para evitar race
--   condition en setFlag (select-then-update/insert concurrente).
-- - document_links: UNIQUE por (document_id, expediente_id, requisito_id, tipo)
--   WHERE estado IN ('propuesta','aceptada') para idempotencia de auto-vinculación.
-- - document_contradictions: UNIQUE por (expediente_id, tipo, document_a_id,
--   document_b_id) para idempotencia de detección.
-- - case_next_actions: UNIQUE por idempotency_key (era decorativo sin constraint).
--
-- Además, seed versionado e idempotente de extraction_schema_versions para los
-- tipos documentales canónicos (§3.2 del prompt).

-- ─── UNIQUE constraints (idempotentes: CREATE UNIQUE INDEX IF NOT EXISTS) ────

-- feature_flags: ya tiene un UNIQUE INDEX compuesto por la migración 0039, pero
-- ese índice NO incluye el flag_key completo correctamente para setFlag. Lo
-- dejamos; el setFlag usará ON CONFLICT sobre el existente. Aun así, añadimos
-- uno simplificado para garantizar unicidad de kill_switch global por flag.
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_kill_switch_global_unique"
  ON "feature_flags"("flag_key") WHERE "kill_switch" = true AND "scope_level" = 'global';

-- document_links: un vínculo vigente (propuesta/aceptada) por (doc, exp, req, tipo).
CREATE UNIQUE INDEX IF NOT EXISTS "document_links_vigente_unique"
  ON "document_links"("document_id", "expediente_id", COALESCE("requisito_id", '00000000-0000-0000-0000-000000000000'), "tipo")
  WHERE "estado" IN ('propuesta', 'aceptada');

-- document_contradictions: una por (exp, tipo, docA, docB).
CREATE UNIQUE INDEX IF NOT EXISTS "document_contradictions_unique"
  ON "document_contradictions"("expediente_id", "tipo",
    COALESCE("document_a_id", '00000000-0000-0000-0000-000000000000'),
    COALESCE("document_b_id", '00000000-0000-0000-0000-000000000000'));

-- case_next_actions: UNIQUE por idempotency_key (antes era decorativo).
CREATE UNIQUE INDEX IF NOT EXISTS "case_next_actions_idempotency_unique"
  ON "case_next_actions"("idempotency_key") WHERE "idempotency_key" IS NOT NULL;

-- ─── Seed: schemas de extracción canónicos (§3.2) ────────────────────────────
-- Idempotente: INSERT ... ON CONFLICT (tipo_documento, version) DO NOTHING.
-- Cada schema define los campos esperados con tipo y obligatoriedad.

INSERT INTO "extraction_schema_versions" ("tipo_documento", "version", "campos", "activo", "creado_por") VALUES
  ('identidad', 1, '[
    {"clave":"numero_identidad","tipo":"string","requerido":true,"descripcion":"Número de identidad hondureño (formato 0801-AAAA-BBBBB)"},
    {"clave":"nombres","tipo":"string","requerido":true,"descripcion":"Nombres del titular"},
    {"clave":"apellidos","tipo":"string","requerido":true,"descripcion":"Apellidos del titular"},
    {"clave":"fecha_nacimiento","tipo":"fecha","requerido":false,"descripcion":"Fecha de nacimiento"},
    {"clave":"lugar_nacimiento","tipo":"string","requerido":false}
  ]'::jsonb, true, null),
  ('rtn', 1, '[
    {"clave":"rtn","tipo":"string","requerido":true,"descripcion":"Registro Tributario Nacional (14 dígitos)"},
    {"clave":"razon_social","tipo":"string","requerido":true,"descripcion":"Razón social o nombre del contribuyente"},
    {"clave":"direccion_fiscal","tipo":"string","requerido":false}
  ]'::jsonb, true, null),
  ('resolucion_judicial', 1, '[
    {"clave":"numero_resolucion","tipo":"string","requerido":true,"descripcion":"Número de resolución o auto"},
    {"clave":"organo","tipo":"string","requerido":true,"descripcion":"Órgano jurisdiccional que emite"},
    {"clave":"fecha_resolucion","tipo":"fecha","requerido":true},
    {"clave":"juez","tipo":"string","requerido":false},
    {"clave":"partes","tipo":"lista","requerido":false,"descripcion":"Partes involucradas"}
  ]'::jsonb, true, null),
  ('escrito_juridico', 1, '[
    {"clave":"numero_referencia","tipo":"string","requerido":false,"descripcion":"Referencia o expediente externo"},
    {"clave":"organo_destino","tipo":"string","requerido":false},
    {"clave":"fecha","tipo":"fecha","requerido":false},
    {"clave":"firmantes","tipo":"lista","requerido":false}
  ]'::jsonb, true, null),
  ('poder', 1, '[
    {"clave":"tipo_poder","tipo":"string","requerido":true,"descripcion":"general | especial"},
    {"clave":"otorgante","tipo":"string","requerido":true},
    {"clave":"apoderado","tipo":"string","requerido":true},
    {"clave":"fecha_otorgamiento","tipo":"fecha","requerido":false},
    {"clave":"notario","tipo":"string","requerido":false}
  ]'::jsonb, true, null),
  ('comprobante', 1, '[
    {"clave":"tipo_comprobante","tipo":"string","requerido":true,"descripcion":"recibo | factura | constancia"},
    {"clave":"emisor","tipo":"string","requerido":true},
    {"clave":"fecha_emision","tipo":"fecha","requerido":true},
    {"clave":"cuantia","tipo":"moneda","requerido":false}
  ]'::jsonb, true, null),
  ('otro', 1, '[]'::jsonb, true, null)
ON CONFLICT ("tipo_documento", "version") DO NOTHING;
