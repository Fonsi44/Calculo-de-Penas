#!/usr/bin/env node
/**
 * E2E Seed — datos sintéticos deterministas para Playwright.
 *
 * Usuarios:
 * - admin@test.local / TestAdmin123! / rol=admin
 * - abogado-a@test.local / TestAbogadoA123! / rol=abogado
 * - abogado-b@test.local / TestAbogadoB123! / rol=abogado
 * - twofactor@test.local / Test2FA123! / rol=abogado (2FA enabled)
 *
 * Clientes:
 * - cli-a-1, cli-a-2 (pertenecen al abogado A vía expedientes)
 * - cli-b-1 (pertenece al abogado B)
 *
 * Expedientes:
 * - exp-a-1 → abogado A (asignado)
 * - exp-a-2 → abogado A (asignado)
 * - exp-b-1 → abogado B (asignado)
 *
 * IDs DETERMINISTAS para que los tests puedan referenciarlos.
 * Contraseñas: bcryptjs hash de las passwords arriba.
 * SIN PII real, SIN secretos de producción.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
config({ path: resolve(ROOT, '.env.local') });
config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('[E2E-SEED] DATABASE_URL no definida');
  process.exit(1);
}

const SALT = 12;

async function hash(pw) {
  return bcryptjs.hash(pw, SALT);
}

async function main() {
  const hashes = {
    admin: await hash('TestAdmin123!'),
    abogadoA: await hash('TestAbogadoA123!'),
    abogadoB: await hash('TestAbogadoB123!'),
    twofactor: await hash('Test2FA123!'),
  };

  // Construir SQL de seed
  const now = new Date().toISOString();
  const sql = `
-- E2E SEED — Datos sintéticos deterministas
-- NO USAR EN PRODUCCIÓN

-- Roles y Permisos (Fase 1)
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
ON CONFLICT ("recurso", "accion") DO NOTHING;

INSERT INTO "roles" ("nombre", "descripcion") VALUES
  ('administrador','Gestión completa del sistema y SGIE'),
  ('abogado','Expedientes asignados, documentos, tareas y calendario relacionado'),
  ('supervisor','Supervisión de equipos y reasignación de expedientes')
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permisos" p
WHERE r.nombre = 'administrador'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r.id, p.id FROM "roles" r JOIN "permisos" p
  ON (p.recurso, p.accion) IN (
    ('cases','read'),('cases','create'),('cases','update'),
    ('documents','read'),('documents','review'),
    ('calendar','read'),('calendar','write')
  )
WHERE r.nombre = 'abogado'
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;

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

-- Usuarios
INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, bloqueado, token_version, creado_en)
VALUES
  ('aaaaaaaa-0000-4000-a000-000000000001', 'admin@test.local', 'Admin Test', '${hashes.admin}', 'admin', true, false, 0, '${now}'),
  ('aaaaaaaa-0000-4000-a000-000000000002', 'abogado-a@test.local', 'Abogado A', '${hashes.abogadoA}', 'abogado', true, false, 0, '${now}'),
  ('aaaaaaaa-0000-4000-a000-000000000003', 'abogado-b@test.local', 'Abogado B', '${hashes.abogadoB}', 'abogado', true, false, 0, '${now}'),
  ('aaaaaaaa-0000-4000-a000-000000000004', 'twofactor@test.local', 'Usuario 2FA', '${hashes.twofactor}', 'abogado', true, false, 0, '${now}')
ON CONFLICT (id) DO NOTHING;

-- 2FA secret para usuario 2FA (sintético, solo tests)
INSERT INTO two_factor_secrets (usuario_id, secret_cifrado, creado_en)
VALUES ('aaaaaaaa-0000-4000-a000-000000000004', 'test-encrypted-secret-synthetic', '${now}')
ON CONFLICT DO NOTHING;

-- Clientes (sin PII real)
INSERT INTO clientes (id, nombre, identidad, rtn, email, activo, creado_por, creado_en)
VALUES
  ('bbbbbbbb-0000-4000-a000-000000000001', 'Cliente A1 Test', '0801-1900-00001', null, 'cliente-a1@test.local', true, 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('bbbbbbbb-0000-4000-a000-000000000002', 'Cliente A2 Test', '0801-1900-00002', null, 'cliente-a2@test.local', true, 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('bbbbbbbb-0000-4000-a000-000000000003', 'Cliente B1 Test', '0801-1900-00003', null, 'cliente-b1@test.local', true, 'aaaaaaaa-0000-4000-a000-000000000003', '${now}')
ON CONFLICT (id) DO NOTHING;

-- Expedientes
INSERT INTO expedientes (id, cliente_id, estado, creado_por, creado_en, numero_interno)
VALUES
  ('cccccccc-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-a000-000000000001', 'pendiente_de_documentos', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}', 'EXP-SEED-01'),
  ('cccccccc-0000-4000-a000-000000000002', 'bbbbbbbb-0000-4000-a000-000000000002', 'documentos_completos', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}', 'EXP-SEED-02'),
  ('cccccccc-0000-4000-a000-000000000003', 'bbbbbbbb-0000-4000-a000-000000000003', 'pendiente_de_documentos', 'aaaaaaaa-0000-4000-a000-000000000003', '${now}', 'EXP-SEED-03')
ON CONFLICT (id) DO NOTHING;

-- Asignaciones (abogado A → exp-a-1, exp-a-2; abogado B → exp-b-1)
INSERT INTO expediente_asignaciones (expediente_id, abogado_id, asignado_en)
VALUES
  ('cccccccc-0000-4000-a000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('cccccccc-0000-4000-a000-000000000002', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('cccccccc-0000-4000-a000-000000000003', 'aaaaaaaa-0000-4000-a000-000000000003', '${now}')
ON CONFLICT DO NOTHING;

-- Schemas de extracción canónicos (Fase 4A)
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
  ('otro', 1, '[]'::jsonb, true, null);
`;

  // Write to temp file and execute with psql
  console.log('[E2E-SEED] Ejecutando seed con pg...');
  const { Client } = await import('pg');
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }

  console.log('[E2E-SEED] ✅ Seed completado.');
}

main().catch((err) => {
  console.error('[E2E-SEED] ❌ Error:', err.message);
  process.exit(1);
});
