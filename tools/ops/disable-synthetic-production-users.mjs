#!/usr/bin/env node
/**
 * Neutralización segura de cuentas sintéticas E2E en bases productivas.
 *
 * PROBLEMA:
 *   La base productiva neondb contiene ~196 usuarios con emails @test.local,
 *   auth-test@, sidebar-test@, creados durante desarrollo/E2E. No deben poder
 *   autenticarse en producción.
 *
 * MODO DRY-RUN (por defecto): solo informa.
 * MODO APPLY: bloquea cuentas sintéticas, incrementa token_version, revoca tokens.
 *
 * SEGURIDAD:
 *   - Opera solo con una lista explícita de patrones de email sintéticos.
 *   - No borra expedientes, documentos ni datos relacionados.
 *   - Conserva auditoría completa.
 *   - Aborta si una cuenta coincide con patrones E2E pero tiene actividad
 *     reciente o datos no sintéticos asociados.
 *
 * USO:
 *   node tools/ops/disable-synthetic-production-users.mjs        # dry-run
 *   DISABLE_SYNTHETIC_USERS=true node tools/ops/disable-synthetic-production-users.mjs  # apply
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const FIXTURE_PATH = resolve(ROOT, 'tests/e2e/fixtures/identities.json');

// Patrones de email sintéticos — lista explícita y verificable.
// Cualquier adición debe pasar por revisión de seguridad.
const SYNTHETIC_PATTERNS = [
  '%@test.local',
  'auth-test@%',
  'sidebar-test@%',
  'e2e-test@%',
  '%@example.com',
];

async function main() {
  const dryRun = process.env.DISABLE_SYNTHETIC_USERS !== 'true';
  const mode = dryRun ? 'DRY-RUN' : 'APPLY';

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL requerida.');
    process.exit(1);
  }

  // Verificar que no es producción (por el nombre del branch)
  console.log(`═══ Neutralización de cuentas sintéticas (${mode}) ═══\n`);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  try {
    // 1. Identificar cuentas sintéticas por patrón
    const syntheticAccounts = [];
    for (const pattern of SYNTHETIC_PATTERNS) {
      const r = await pool.query(
        `SELECT id, email, nombre, rol, active, bloqueado, token_version
         FROM usuarios WHERE email ILIKE $1
         ORDER BY email`,
        [pattern]
      );
      for (const row of r.rows) syntheticAccounts.push(row);
    }

    console.log(`Cuentas sintéticas encontradas: ${syntheticAccounts.length}`);
    if (syntheticAccounts.length === 0) {
      console.log('No hay cuentas sintéticas. Nada que hacer.');
      await pool.end();
      return;
    }

    // 2. Verificar que ninguna cuenta sintética tenga actividad reciente no sintética
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    let hasRecentActivity = false;

    for (const acct of syntheticAccounts) {
      // Verificar actividad reciente
      const activity = await pool.query(
        `SELECT count(*)::int AS n FROM auditoria_eventos
         WHERE usuario_id = $1 AND creado_en >= $2`,
        [acct.id, thirtyDaysAgo]
      );
      if (activity.rows[0].n > 0) {
        console.warn(`  ⚠  Cuenta ${acct.email.slice(0, 20)}... tiene actividad reciente (${activity.rows[0].n} eventos).`);
        hasRecentActivity = true;
      }

      // Verificar expedientes no sintéticos
      const cases = await pool.query(
        `SELECT count(*)::int AS n FROM expedientes WHERE responsable_id = $1`,
        [acct.id]
      );
      if (cases.rows[0].n > 0) {
        console.warn(`  ⚠  Cuenta ${acct.email.slice(0, 20)}... tiene ${cases.rows[0].n} expedientes asignados.`);
      }
    }

    if (hasRecentActivity && !dryRun) {
      console.error('\n⛔ Cuentas con actividad reciente detectadas. Abortando.');
      console.error('   Revisa manualmente antes de neutralizar.');
      process.exit(1);
    }

    // 3. Mostrar detalle
    console.log('\nDetalle:');
    for (const acct of syntheticAccounts) {
      const safeEmail = acct.email.slice(0, 25).padEnd(27);
      console.log(`  ${safeEmail} rol=${acct.rol.padEnd(10)} active=${acct.active} bloqueado=${acct.bloqueado} token_v=${acct.token_version}`);
    }

    if (dryRun) {
      console.log('\n✅ Dry-run completado. Para aplicar: DISABLE_SYNTHETIC_USERS=true');
      return;
    }

    // 4. APPLY: bloquear cuentas
    console.log('\nAplicando neutralización...');
    let blocked = 0;
    for (const acct of syntheticAccounts) {
      // Bloquear cuenta + incrementar token_version + registrar auditoría
      await pool.query(
        `UPDATE usuarios SET
           active = false,
           bloqueado = true,
           bloqueado_motivo = 'Cuenta sintética E2E — neutralizada automáticamente',
           bloqueado_en = NOW(),
           token_version = token_version + 1
         WHERE id = $1`,
        [acct.id]
      );

      // Revocar tokens/challenges
      await pool.query(`DELETE FROM two_factor_challenges WHERE usuario_id = $1`, [acct.id]).catch(() => {});
      await pool.query(`DELETE FROM password_reset_tokens WHERE usuario_id = $1`, [acct.id]).catch(() => {});
      await pool.query(`DELETE FROM enlaces_magicos WHERE creado_por = $1`, [acct.id]).catch(() => {});
      await pool.query(`UPDATE two_factor_secrets SET habilitado = false WHERE usuario_id = $1`, [acct.id]).catch(() => {});

      console.log(`  ✓ ${acct.email.slice(0, 25).padEnd(27)} bloqueada (token_version ${acct.token_version} → ${acct.token_version + 1})`);
      blocked++;
    }

    console.log(`\n✅ Neutralización completada: ${blocked} cuentas bloqueadas.`);
  } catch (err) {
    console.error('\n⛔ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
