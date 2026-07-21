-- Migration 0045: P2-08 — Paquetes preparados para firma (Fase 4B-2)
--
-- Añade:
-- 1. Tabla signature_packages (cabecera de paquete con manifiesto congelado).
-- 2. Tabla signature_package_items (documentos/versiones incluidas).
-- 3. Tabla signature_package_signers (firmantes previstos, sin ejecutar firma).
-- 4. Enum values de auditoría para paquetes.
-- 5. Seed feature flag sgie.signature.packages (deny-by-default).
-- 6. Capacidad signature.manage (permiso en tabla permisos).
--
-- Idempotente (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / ON CONFLICT).
--
-- Rollback documentado:
--   DROP TABLE IF EXISTS signature_package_signers CASCADE;
--   DROP TABLE IF EXISTS signature_package_items CASCADE;
--   DROP TABLE IF EXISTS signature_packages CASCADE;
--   ALTER TYPE auditoria_accion no puede eliminar valores sin recrear el type.
--   DELETE FROM feature_flags WHERE flag_key = 'sgie.signature.packages';
--   DELETE FROM permisos WHERE recurso = 'signature' AND accion = 'manage';

-- ─── 1. Cabecera de paquete de firma ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "expediente_id" uuid NOT NULL REFERENCES "expedientes"("id") ON DELETE CASCADE,
  "organization_id" uuid,
  "actor_id" uuid NOT NULL REFERENCES "usuarios"("id"),
  "estado" varchar(30) NOT NULL DEFAULT 'draft',
  "version" integer NOT NULL DEFAULT 1,
  "proposito" varchar(100),
  "titulo" varchar(300) NOT NULL,
  "idempotency_key" varchar(120) NOT NULL,
  "preview_hash" varchar(64),
  "manifest_hash" varchar(64),
  "manifest_schema_version" varchar(20) NOT NULL DEFAULT '1.0',
  "hash_algorithm" varchar(20) NOT NULL DEFAULT 'sha256',
  "manifest_json" jsonb,
  "document_order" jsonb NOT NULL DEFAULT '[]',
  "readiness_run_id" uuid,
  "readiness_exception" boolean NOT NULL DEFAULT false,
  "readiness_exception_motivo" text,
  "congelado_en" timestamp with time zone,
  "expiracion_en" timestamp with time zone,
  "cancelado_motivo" text,
  "correlation_id" varchar(64),
  "creado_en" timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Idempotencia: (expediente, idempotency_key) único.
CREATE UNIQUE INDEX IF NOT EXISTS "signature_packages_exp_idem_unique"
  ON "signature_packages"("expediente_id", "idempotency_key");
-- Un paquete activo por expediente (ready/locked).
CREATE UNIQUE INDEX IF NOT EXISTS "signature_packages_exp_active_unique"
  ON "signature_packages"("expediente_id")
  WHERE "estado" IN ('ready', 'locked');
CREATE INDEX IF NOT EXISTS "signature_packages_exp_estado_idx"
  ON "signature_packages"("expediente_id", "estado");
CREATE INDEX IF NOT EXISTS "signature_packages_actor_idx"
  ON "signature_packages"("actor_id");

-- ─── 2. Documentos incluidos en el paquete ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_package_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "package_id" uuid NOT NULL REFERENCES "signature_packages"("id") ON DELETE CASCADE,
  "document_id" uuid NOT NULL REFERENCES "documentos_expediente"("id") ON DELETE CASCADE,
  "expediente_id" uuid NOT NULL,
  "version_frozen" integer NOT NULL,
  "nombre_normalizado" varchar(500) NOT NULL,
  "mime" varchar(200),
  "tamano_bytes" integer,
  "hash_sha256" varchar(64) NOT NULL,
  "aprobado_por" uuid,
  "aprobado_en" timestamp with time zone,
  "orden" integer NOT NULL DEFAULT 0,
  "requisito_id" uuid,
  "tipo_documento" varchar(100),
  "metadata_snapshot" jsonb,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un documento con una versión específica una sola vez por paquete.
CREATE UNIQUE INDEX IF NOT EXISTS "signature_package_items_pkg_doc_ver_unique"
  ON "signature_package_items"("package_id", "document_id", "version_frozen");
CREATE INDEX IF NOT EXISTS "signature_package_items_pkg_idx"
  ON "signature_package_items"("package_id");
CREATE INDEX IF NOT EXISTS "signature_package_items_doc_idx"
  ON "signature_package_items"("document_id");

-- ─── 3. Firmantes previstos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "signature_package_signers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "package_id" uuid NOT NULL REFERENCES "signature_packages"("id") ON DELETE CASCADE,
  "nombre" varchar(300) NOT NULL,
  "email" varchar(255),
  "identificador" varchar(100),
  "rol_documento" varchar(100) NOT NULL,
  "orden" integer NOT NULL DEFAULT 0,
  "obligatorio" boolean NOT NULL DEFAULT true,
  "metodo_futuro" varchar(50),
  "estado_validacion" varchar(30) NOT NULL DEFAULT 'pendiente',
  "fuente" varchar(30) NOT NULL DEFAULT 'manual',
  "consentimiento" text,
  "validado_en" timestamp with time zone,
  "creado_en" timestamp with time zone NOT NULL DEFAULT now()
);
-- Un firmante una sola vez por paquete (por nombre + rol).
CREATE UNIQUE INDEX IF NOT EXISTS "signature_package_signers_pkg_name_rol_unique"
  ON "signature_package_signers"("package_id", "nombre", "rol_documento");
CREATE INDEX IF NOT EXISTS "signature_package_signers_pkg_idx"
  ON "signature_package_signers"("package_id");

-- ─── 4. Enum de auditoría: acciones de paquetes de firma ───────────────────
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_package_created';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_package_ready';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_package_locked';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_package_cancelled';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_package_superseded';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'signature_package_verified';

-- ─── 5. Capacidad signature.manage ──────────────────────────────────────────
INSERT INTO "permisos" ("recurso", "accion", "descripcion")
VALUES ('signature', 'manage', 'Gestionar paquetes preparados para firma')
ON CONFLICT ("recurso", "accion") DO NOTHING;

-- ─── 6. Asignar signature.manage a roles administrativos ────────────────────
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre IN ('administrador', 'supervisor')
  AND p.recurso = 'signature' AND p.accion = 'manage'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

-- ─── 7. Seed feature flag ───────────────────────────────────────────────────
INSERT INTO "feature_flags"
  ("flag_key", "scope_level", "enabled", "kill_switch", "motivo", "creado_en", "actualizado_en")
VALUES
  ('sgie.signature.packages', 'global', false, false, 'P2-08 deny-by-default', now(), now())
ON CONFLICT DO NOTHING;
