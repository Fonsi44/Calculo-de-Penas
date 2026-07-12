#!/usr/bin/env node
/**
 * E2E Cleanup — Subfase 2.
 *
 * Limpia datos de test de la base efímera. Diseñado para ejecutarse siempre
 * (incluso si las pruebas fallan) mediante trap en el script de ejecución.
 *
 * NO ejecuta DROP TABLE ni DROP DATABASE (la base es efímera y se destruye
 * por el operador). Solo elimina las filas insertadas por el seed.
 *
 * Es idempotente: puede ejecutarse múltiples veces sin error.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
config({ path: resolve(ROOT, '.env.local') });
config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('[E2E-CLEANUP] DATABASE_URL no definida — nada que limpiar.');
  process.exit(0);
}

const cleanupSql = `
DELETE FROM expediente_asignaciones WHERE abogado_id LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM expedientes WHERE creado_por LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM clientes WHERE creado_por LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM two_factor_secrets WHERE usuario_id LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM two_factor_challenges WHERE usuario_id LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM password_reset_tokens WHERE usuario_id LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM preview_tokens WHERE created_by LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
DELETE FROM usuarios WHERE id LIKE 'aaaaaaaa-0000-4000-a000-00000000000%';
`;

async function main() {
  const { writeFileSync, unlinkSync } = await import('fs');
  const tmpFile = resolve(ROOT, 'scripts', 'e2e', '.cleanup-tmp.sql');
  writeFileSync(tmpFile, cleanupSql);

  await new Promise((resolve, reject) => {
    const child = spawn('psql', [DB_URL, '-f', tmpFile], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PGCONNECT_TIMEOUT: '10' },
    });
    child.on('exit', (code) => {
      try { unlinkSync(tmpFile); } catch {}
      code === 0 ? resolve() : reject(new Error(`cleanup exited ${code}`));
    });
  });

  console.log('[E2E-CLEANUP] ✅ Datos de test eliminados.');
}

main().catch(() => {
  // Best-effort: no bloquear aunque falle la limpieza
  console.log('[E2E-CLEANUP] ⚠️ Limpieza falló (best-effort, no bloqueante).');
  process.exit(0);
});
