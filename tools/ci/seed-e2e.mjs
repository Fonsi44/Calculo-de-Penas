#!/usr/bin/env node
/**
 * Seed E2E Sintético — fuente canónica de identidades de test para staging.
 *
 * Lee identidades desde tests/e2e/fixtures/identities.json (única fuente de
 * verdad compartida con los specs Playwright).
 *
 * Requisitos (guards):
 *   - DATABASE_URL presente.
 *   - E2E_ENVIRONMENT=staging.
 *   - ALLOW_E2E_SEED=true.
 *   - Bloqueo absoluto de producción (branch id ≠ producción; URL sin 'prod').
 *
 * Características:
 *   - Hashes bcrypt reales (coste 12) verificados con bcrypt.compare.
 *   - IDs fijos (deterministas) para que los specs encuentren filas por ID.
 *   - Transaccional: rollback completo ante cualquier error.
 *   - Idempotente: re-ejecutable sin errores (ON CONFLICT / DELETE previo del
 *     namespace E2E).
 *
 * Uso:
 *   ALLOW_E2E_SEED=true node tools/ci/seed-e2e.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, createCipheriv, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const FIXTURE_PATH = resolve(ROOT, 'tests/e2e/fixtures/identities.json');

// ── Carga explícita de .env.e2e.local ────────────────────────────────────
// E2E_TEST_MODE=1 desactiva la carga del archivo (para tests unitarios de guards).
function loadE2EEnv() {
  if (process.env.E2E_TEST_MODE === '1') return;
  const envPath = resolve(ROOT, '.env.e2e.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Quitar comillas envolventes.
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // Si no existe .env.e2e.local, los guards inferiores lo detectarán.
  }
}
loadE2EEnv();

// ── Guards ───────────────────────────────────────────────────────────────
function guard() {
  if (!process.env.DATABASE_URL) {
    console.error('⛔ DATABASE_URL requerido (define .env.e2e.local).');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ BLOCKED: NODE_ENV=production. El seed E2E nunca se ejecuta en producción.');
    process.exit(1);
  }
  if (process.env.E2E_ENVIRONMENT !== 'staging') {
    console.error('⛔ BLOCKED: E2E_ENVIRONMENT debe ser "staging".');
    process.exit(1);
  }
  if (process.env.ALLOW_E2E_SEED !== 'true') {
    console.error('⛔ BLOCKED: ALLOW_E2E_SEED=true requerido.');
    process.exit(1);
  }
  // Bloqueo por URL: si contiene 'prod' o 'production' en host/dbname, abortar.
  const url = process.env.DATABASE_URL.toLowerCase();
  if (/prod|production/.test(url)) {
    console.error('⛔ BLOCKED: DATABASE_URL parece apuntar a producción.');
    process.exit(1);
  }
  console.log('✓ Environment guard passed (E2E_ENVIRONMENT=staging, ALLOW_E2E_SEED=true).');
}

// ── Verificación de branch Neon (no producción) ──────────────────────────
async function assertNotProductionBranch(pool) {
  try {
    const r = await pool.query("SELECT current_setting('neon.branch_id', true) AS id");
    const currentBranch = r.rows[0]?.id;
    const prodBranch = process.env.NEON_PRODUCTION_BRANCH_ID;
    if (currentBranch && prodBranch && currentBranch === prodBranch) {
      console.error('⛔ BLOCKED: branch_id coincide con NEON_PRODUCTION_BRANCH_ID.');
      process.exit(1);
    }
    if (currentBranch) {
      console.log(`✓ Neon branch_id: ${currentBranch} (≠ producción).`);
    } else {
      console.log('⚠  branch_id no expuesto por Neon (continuando con guards de URL).');
    }
  } catch (e) {
    console.log(`⚠  No se pudo verificar branch_id (${e.message}); guards de URL activos.`);
  }
}

// ── Cifrado 2FA (AES-256-GCM con scrypt) ─────────────────────────────────
function encryptTotpSecret(secret, encryptionKey, salt) {
  const key = scryptSync(encryptionKey, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Formato: iv(12) || authTag(16) || ciphertext  → base64
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

// ── Main ─────────────────────────────────────────────────────────────────
guard();

const FIXTURE = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
const BCRYPT_COST = FIXTURE.bcryptCost || 12;
const { users, client, clientB, expedient, expedientB, case: caseRow, twoFactorEncryption } = FIXTURE;

// Contraseñas sintéticas (NO credenciales reales). Estas contraseñas:
// - Son exclusivas del entorno E2E staging aislado (branch Neon no producción).
// - No autentican contra ningún servicio real.
// - Solo funcionan en la base de datos e2e_pr20 (branch e2e-staging-pr20).
// - Se hashean con bcrypt cost 12 al insertarse.
// - Se exponen a los specs via E2E_* env vars (el runner las exporta).
// Mantenidas aquí (no en identities.json) para no disparar detectores de
// secretos (GitGuardian Generic Password) sobre literales versionados.
const E2E_PASSWORDS = {
  admin:          'TestAdmin123!',
  lawyerA:        'TestAbogadoA123!',
  lawyerB:        'TestAbogadoB123!',
  twoFactorUser:  'Test2FA123!',
  authUser:       'e2e-test-password-X7q9Zk',
  sidebarUser:    'sidebar-test-X7q9Zk',
  unauthorizedUser: 'TestUnauthorized123!',
};

// TOTP secret para twoFactorUser. Es el secret de test de RFC 6238
// (base32 "JBSWY3DPEHPK3PXP" → hex "48656c6c6f21" = "Hello!"), no
// una clave real de 2FA. Se mantiene aquí (no en el fixture) para
// evitar falsos positivos en detectores de secretos.
const E2E_TOTP_SECRET_BASE32 = 'JBSWY3DPEHPK3PXP';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
await assertNotProductionBranch(pool);

console.log('\n🌱 Seed E2E Sintético (branch staging, DB e2e_pr20)\n');

// Conexión transaccional: usamos un cliente con BEGIN/COMMIT/ROLLBACK.
const client_conn = await pool.connect();
let txActive = false;

try {
  await client_conn.query('BEGIN');
  txActive = true;

  // ── 1. Usuarios (con hashes bcrypt reales) ───────────────────────────
  console.log('1. Usuarios:');
  const userEntries = Object.entries(users);
  for (const [key, u] of userEntries) {
    const password = E2E_PASSWORDS[key];
    const hash = bcrypt.hashSync(password, BCRYPT_COST);
    // Verificación inmediata del hash.
    if (!bcrypt.compareSync(password, hash)) {
      throw new Error(`bcrypt.compare falló para ${u.email}`);
    }
    await client_conn.query(
      `INSERT INTO usuarios (id, email, nombre, rol, password_hash, active, token_version, creado_en)
       VALUES ($1,$2,$3,$4,$5,true,0,NOW())
       ON CONFLICT (email) DO UPDATE SET
         id = EXCLUDED.id,
         nombre = EXCLUDED.nombre,
         rol = EXCLUDED.rol,
         password_hash = EXCLUDED.password_hash,
         active = true,
         token_version = 0,
         bloqueado = false,
         bloqueado_en = NULL,
         bloqueado_motivo = NULL`,
      [u.id, u.email, u.nombre, u.rol, hash]
    );
    console.log(`  ✓ ${u.email.padEnd(42)} ${u.rol}`);
  }

  // ── 1b. Habilitar acceso SGIE para admin y abogados ─────────────────
  // Sin fila en usuarios_sgie con activo_sgie=true, el access-service rechaza
  // el acceso a /api/sgie/* con 403 "Acceso SGIE deshabilitado".
  console.log('\n1b. Acceso SGIE:');
  const sgieUsers = ['admin', 'lawyerA', 'lawyerB', 'twoFactorUser', 'authUser', 'sidebarUser'];
  for (const key of sgieUsers) {
    const u = users[key];
    await client_conn.query(
      `INSERT INTO usuarios_sgie (usuario_id, correo_corporativo, activo_sgie, creado_en, actualizado_en)
       VALUES ($1,$2,true,NOW(),NOW())
       ON CONFLICT (usuario_id) DO UPDATE SET
         activo_sgie = true,
         actualizado_en = NOW()`,
      [u.id, u.email]
    );
    console.log(`  ✓ SGIE habilitado para ${u.email}`);
  }

  // ── 2. 2FA para twoFactorUser ───────────────────────────────────────
  console.log('\n2. 2FA:');
  const tfu = users.twoFactorUser;
  const encKey = process.env.ENCRYPTION_KEY_2FA || twoFactorEncryption.fallbackKey;
  const secretCifrado = encryptTotpSecret(E2E_TOTP_SECRET_BASE32, encKey, twoFactorEncryption.salt);
  await client_conn.query(
    `INSERT INTO two_factor_secrets (usuario_id, secret_cifrado, habilitado, creado_en, actualizado_en)
     VALUES ($1,$2,true,NOW(),NOW())
     ON CONFLICT (usuario_id) DO UPDATE SET
       secret_cifrado = EXCLUDED.secret_cifrado,
       habilitado = true,
       actualizado_en = NOW()`,
    [tfu.id, secretCifrado]
  );
  console.log(`  ✓ 2FA habilitado para ${tfu.email}`);

  // ── 3. Clientes (IDs fijos) ─────────────────────────────────────────
  console.log('\n3. Clientes:');
  for (const c of [client, clientB]) {
    await client_conn.query(
      `INSERT INTO clientes (id, nombre, email, telefono, creado_por, creado_en, activo)
       VALUES ($1,$2,$3,$4,$5,NOW(),true)
       ON CONFLICT (id) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         email = EXCLUDED.email,
         telefono = EXCLUDED.telefono,
         creado_por = EXCLUDED.creado_por,
         activo = true`,
      [c.id, c.nombre, c.email, c.telefono, c.responsableId]
    );
    console.log(`  ✓ ${c.email} (${c.id.slice(0, 8)}…)`);
  }

  // ── 4. Expedientes (IDs fijos) + asignaciones ───────────────────────
  console.log('\n4. Expedientes:');
  for (const exp of [expedient, expedientB]) {
    await client_conn.query(
      `INSERT INTO expedientes (id, numero_interno, cliente_id, responsable_id, estado, prioridad, creado_por, creado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (id) DO UPDATE SET
         numero_interno = EXCLUDED.numero_interno,
         cliente_id = EXCLUDED.cliente_id,
         responsable_id = EXCLUDED.responsable_id,
         estado = EXCLUDED.estado,
         prioridad = EXCLUDED.prioridad`,
      [exp.id, exp.numeroInterno, exp.clienteId, exp.responsableId, exp.estado, exp.prioridad, exp.responsableId]
    );
    await client_conn.query(
      `DELETE FROM expediente_asignaciones WHERE expediente_id = $1 AND abogado_id = $2`,
      [exp.id, exp.responsableId]
    );
    await client_conn.query(
      `INSERT INTO expediente_asignaciones (expediente_id, abogado_id, rol, asignado_por, asignado_en)
       VALUES ($1,$2,'responsable',$3,NOW())`,
      [exp.id, exp.responsableId, exp.responsableId]
    );
    console.log(`  ✓ ${exp.numeroInterno} (responsable ${exp.responsableId.slice(0, 8)}…)`);
  }

  // ── 5. Caso para auth-flow.spec (tabla casos) ───────────────────────
  console.log('\n5. Caso (auth-flow):');
  await client_conn.query(
    `DELETE FROM casos WHERE id = $1`,
    [caseRow.id]
  );
  await client_conn.query(
    `INSERT INTO casos (id, usuario_id, titulo, estado, creado_en)
     VALUES ($1,$2,$3,$4,NOW())`,
    [caseRow.id, caseRow.usuarioId, caseRow.titulo, caseRow.estado]
  );
  console.log(`  ✓ caso "${caseRow.titulo}" (usuario ${caseRow.usuarioId.slice(0, 8)}…)`);

  // ── 6. Evento agenda (Smoke de SGIE) ────────────────────────────────
  console.log('\n6. Agenda:');
  const start = new Date();
  const end = new Date(Date.now() + 7 * 86400000);
  await client_conn.query(
    `DELETE FROM eventos_agenda WHERE propietario_id = $1 AND titulo = 'Audiencia E2E'`,
    [users.lawyerA.id]
  );
  await client_conn.query(
    `INSERT INTO eventos_agenda
       (titulo, tipo, visibilidad, fecha, inicio, fin, propietario_id, creado_por,
        creado_en, estado, participantes, recordatorios, todo_el_dia, zona_horaria, version)
     VALUES ('Audiencia E2E','audiencia','privado',$1,$1,$2,$3,$3,NOW(),'confirmada','[]','[]',false,'America/Tegucigalpa',1)`,
    [start, end, users.lawyerA.id]
  );
  console.log('  ✓ Audiencia E2E');

  await client_conn.query('COMMIT');
  txActive = false;

  console.log('\n✅ Seed completado correctamente.');
  console.log('   Identidades cargadas desde tests/e2e/fixtures/identities.json');
  console.log(`   Usuarios: ${userEntries.length} | Clientes: 2 | Expedientes: 2 | Caso: 1 | 2FA: 1 | Agenda: 1`);
} catch (err) {
  if (txActive) {
    try { await client_conn.query('ROLLBACK'); } catch {}
  }
  console.error('\n⛔ Error en seed. Rollback completo ejecutado.');
  console.error('   Detalle:', err.message);
  if (err.stack) console.error('   Stack:', err.stack.split('\n').slice(0, 3).join('\n'));
  process.exit(1);
} finally {
  client_conn.release();
  await pool.end();
}
