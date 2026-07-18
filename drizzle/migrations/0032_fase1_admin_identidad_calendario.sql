-- Fase 1 — núcleo Admin, identidad, RBAC y calendario SGIE.
-- Migración aditiva: no elimina tablas ni datos editoriales/publicados.

ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'invitacion_created';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'invitacion_accepted';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'invitacion_revoked';
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'invitacion_resent';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'personal';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'cita_cliente';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'plazo';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'revision_interna';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'firma';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'tarea_hito';
ALTER TYPE "evento_agenda_tipo" ADD VALUE IF NOT EXISTS 'ausencia';
ALTER TYPE "evento_agenda_estado" ADD VALUE IF NOT EXISTS 'cancelada';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "invitacion_estado" AS ENUM ('pendiente', 'aceptada', 'expirada', 'revocada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "evento_agenda_visibilidad" AS ENUM ('privado', 'expediente', 'equipo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equipos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" varchar(200) NOT NULL UNIQUE,
  "activo" boolean NOT NULL DEFAULT true,
  "creado_en" timestamp with time zone DEFAULT now(),
  "actualizado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equipos_miembros" (
  "equipo_id" uuid NOT NULL REFERENCES "equipos"("id") ON DELETE cascade,
  "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE cascade,
  "creado_en" timestamp with time zone DEFAULT now(),
  CONSTRAINT "equipos_miembros_pk" UNIQUE ("equipo_id", "usuario_id")
);
CREATE INDEX IF NOT EXISTS "equipos_miembros_usuario_idx" ON "equipos_miembros" ("usuario_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios_capacidades" (
  "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id") ON DELETE cascade,
  "permiso_id" uuid NOT NULL REFERENCES "permisos"("id") ON DELETE cascade,
  "permitido" boolean NOT NULL DEFAULT true,
  "concedido_por" uuid REFERENCES "usuarios"("id"),
  "creado_en" timestamp with time zone DEFAULT now(),
  CONSTRAINT "usuarios_capacidades_pk" UNIQUE ("usuario_id", "permiso_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitaciones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL,
  "nombre" varchar(200) NOT NULL,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "estado" "invitacion_estado" NOT NULL DEFAULT 'pendiente',
  "rol_inicial" varchar(50) NOT NULL,
  "equipo_id" uuid REFERENCES "equipos"("id"),
  "acceso_sgie" boolean NOT NULL DEFAULT false,
  "capacidades" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "creada_por" uuid NOT NULL REFERENCES "usuarios"("id"),
  "creada_en" timestamp with time zone DEFAULT now(),
  "expira_en" timestamp with time zone NOT NULL,
  "aceptada_en" timestamp with time zone,
  "revocada_en" timestamp with time zone,
  "usuario_id" uuid REFERENCES "usuarios"("id"),
  "email_estado" varchar(50) NOT NULL DEFAULT 'pendiente',
  "email_error" varchar(500),
  "resend_id" varchar(200)
);
CREATE INDEX IF NOT EXISTS "invitaciones_email_idx" ON "invitaciones" ("email");
CREATE INDEX IF NOT EXISTS "invitaciones_estado_idx" ON "invitaciones" ("estado");
CREATE INDEX IF NOT EXISTS "invitaciones_expira_idx" ON "invitaciones" ("expira_en");
--> statement-breakpoint
INSERT INTO "permisos" ("recurso", "accion", "descripcion") VALUES
  ('users','read','Consultar usuarios'),
  ('users','manage','Gestionar usuarios'),
  ('users','invite','Invitar usuarios'),
  ('roles','manage','Gestionar roles y capacidades'),
  ('cases','read','Consultar expedientes accesibles'),
  ('cases','read_all','Consultar todos los expedientes'),
  ('cases','create','Crear expedientes'),
  ('cases','assign','Asignar expedientes'),
  ('cases','update','Actualizar expedientes'),
  ('documents','read','Consultar documentos'),
  ('documents','review','Revisar documentos'),
  ('documents','approve','Aprobar documentos'),
  ('calendar','read','Consultar calendario'),
  ('calendar','write','Crear y modificar calendario propio'),
  ('calendar','manage_team','Gestionar calendarios de equipo'),
  ('settings','manage','Gestionar configuración'),
  ('audit','read','Consultar auditoría')
ON CONFLICT ("recurso", "accion") DO UPDATE SET "descripcion" = EXCLUDED."descripcion";
--> statement-breakpoint
INSERT INTO "roles" ("nombre", "descripcion") VALUES
  ('administrador','Gestión completa del sistema y SGIE'),
  ('abogado','Expedientes asignados, documentos, tareas y calendario relacionado'),
  ('supervisor','Supervisión de equipos y reasignación de expedientes')
ON CONFLICT ("nombre") DO UPDATE SET "descripcion" = EXCLUDED."descripcion";
--> statement-breakpoint
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre = 'administrador'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r JOIN "permisos" p
  ON (p.recurso, p.accion) IN (
    ('cases','read'),('cases','create'),('cases','update'),
    ('documents','read'),('documents','review'),
    ('calendar','read'),('calendar','write')
  )
WHERE r.nombre = 'abogado'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r JOIN "permisos" p
  ON (p.recurso, p.accion) IN (
    ('users','read'),('cases','read'),('cases','read_all'),('cases','create'),
    ('cases','assign'),('cases','update'),('documents','read'),
    ('documents','review'),('documents','approve'),('calendar','read'),
    ('calendar','write'),('calendar','manage_team'),('audit','read')
  )
WHERE r.nombre = 'supervisor'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "usuarios_roles" ("usuario_id", "rol_id")
SELECT u.id, r.id
FROM "usuarios" u
JOIN "roles" r ON r.nombre = CASE
  WHEN u.rol = 'admin' THEN 'administrador'
  WHEN u.rol = 'supervisor' THEN 'supervisor'
  ELSE 'abogado'
END
ON CONFLICT ("usuario_id", "rol_id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "propietario_id" uuid;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "creado_por" uuid;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "inicio" timestamp with time zone;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "fin" timestamp with time zone;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "todo_el_dia" boolean NOT NULL DEFAULT false;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "zona_horaria" varchar(100) NOT NULL DEFAULT 'America/Tegucigalpa';
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "ubicacion" varchar(500);
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "visibilidad" "evento_agenda_visibilidad" NOT NULL DEFAULT 'privado';
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "participantes" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "recordatorios" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "eventos_agenda" ADD COLUMN IF NOT EXISTS "cancelada_en" timestamp with time zone;
--> statement-breakpoint
UPDATE "eventos_agenda" e
SET
  "propietario_id" = COALESCE(
    e."confirmada_por",
    (SELECT x."responsable_id" FROM "expedientes" x WHERE x.id = e."expediente_id"),
    (SELECT u.id FROM "usuarios" u WHERE u.rol = 'admin' AND u.active = true ORDER BY u."creado_en" LIMIT 1)
  ),
  "creado_por" = COALESCE(
    e."confirmada_por",
    (SELECT x."responsable_id" FROM "expedientes" x WHERE x.id = e."expediente_id"),
    (SELECT u.id FROM "usuarios" u WHERE u.rol = 'admin' AND u.active = true ORDER BY u."creado_en" LIMIT 1)
  ),
  "inicio" = e."fecha",
  "visibilidad" = CASE WHEN e."expediente_id" IS NULL THEN 'privado'::"evento_agenda_visibilidad" ELSE 'expediente'::"evento_agenda_visibilidad" END
WHERE e."propietario_id" IS NULL OR e."creado_por" IS NULL OR e."inicio" IS NULL;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "eventos_agenda"
    WHERE "propietario_id" IS NULL OR "creado_por" IS NULL OR "inicio" IS NULL
  ) THEN
    RAISE EXCEPTION 'No se pudo determinar propietario/creador para todos los eventos existentes';
  END IF;
END $$;
ALTER TABLE "eventos_agenda" ALTER COLUMN "propietario_id" SET NOT NULL;
ALTER TABLE "eventos_agenda" ALTER COLUMN "creado_por" SET NOT NULL;
ALTER TABLE "eventos_agenda" ALTER COLUMN "inicio" SET NOT NULL;
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_propietario_id_usuarios_id_fk"
  FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id");
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_creado_por_usuarios_id_fk"
  FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id");
CREATE INDEX IF NOT EXISTS "eventos_agenda_propietario_idx" ON "eventos_agenda" ("propietario_id");
CREATE INDEX IF NOT EXISTS "eventos_agenda_inicio_idx" ON "eventos_agenda" ("inicio");

-- Reversión manual: no recomendada en producción porque eliminaría identidad
-- de eventos e invitaciones. Conservar la migración y desactivar funciones por
-- configuración si se requiere rollback funcional.
