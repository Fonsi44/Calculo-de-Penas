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
INSERT INTO expedientes (id, cliente_id, estado, creado_por, creado_en)
VALUES
  ('cccccccc-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-a000-000000000001', 'pendiente_de_documentos', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('cccccccc-0000-4000-a000-000000000002', 'bbbbbbbb-0000-4000-a000-000000000002', 'documentos_completos', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('cccccccc-0000-4000-a000-000000000003', 'bbbbbbbb-0000-4000-a000-000000000003', 'pendiente_de_documentos', 'aaaaaaaa-0000-4000-a000-000000000003', '${now}')
ON CONFLICT (id) DO NOTHING;

-- Asignaciones (abogado A → exp-a-1, exp-a-2; abogado B → exp-b-1)
INSERT INTO expediente_asignaciones (expediente_id, abogado_id, creado_en)
VALUES
  ('cccccccc-0000-4000-a000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('cccccccc-0000-4000-a000-000000000002', 'aaaaaaaa-0000-4000-a000-000000000002', '${now}'),
  ('cccccccc-0000-4000-a000-000000000003', 'aaaaaaaa-0000-4000-a000-000000000003', '${now}')
ON CONFLICT DO NOTHING;
`;

  // Write to temp file and execute with psql
  const { writeFileSync, unlinkSync } = await import('fs');
  const tmpFile = resolve(ROOT, 'scripts', 'e2e', '.seed-tmp.sql');
  writeFileSync(tmpFile, sql);
  console.log('[E2E-SEED] Ejecutando seed...');

  const { spawn } = await import('child_process');
  await new Promise((resolve, reject) => {
    const child = spawn('psql', [DB_URL, '-f', tmpFile], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PGCONNECT_TIMEOUT: '10' },
    });
    child.on('exit', (code) => {
      unlinkSync(tmpFile);
      code === 0 ? resolve() : reject(new Error(`psql seed exited ${code}`));
    });
  });

  console.log('[E2E-SEED] ✅ Seed completado.');
}

main().catch((err) => {
  console.error('[E2E-SEED] ❌ Error:', err.message);
  process.exit(1);
});
