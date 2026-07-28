#!/usr/bin/env node
/**
 * Neutraliza exclusivamente identidades incluidas en una allowlist revisada.
 * La allowlist no se versiona: SYNTHETIC_USER_ALLOWLIST apunta a un JSON local
 * con [{ "id": "<uuid>", "email": "<email exacto>" }].
 *
 * Dry-run por defecto. Apply requiere DISABLE_SYNTHETIC_USERS=true.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Pool } from '@neondatabase/serverless';

export function validateAllowlist(value) {
  if (!Array.isArray(value) || value.length === 0) throw new Error('allowlist vacía');
  const ids = new Set();
  return value.map((entry) => {
    if (!entry || typeof entry.id !== 'string' || typeof entry.email !== 'string') {
      throw new Error('entrada de allowlist inválida');
    }
    if (ids.has(entry.id)) throw new Error('ID duplicado en allowlist');
    ids.add(entry.id);
    return { id: entry.id, email: entry.email.toLowerCase() };
  });
}

export async function neutralizeAccounts(sql, allowlist, { apply = false } = {}) {
  const expected = validateAllowlist(allowlist);
  const ids = expected.map(({ id }) => id);
  if (apply) await sql.query('BEGIN');
  try {
    if (apply) await sql.query('SELECT pg_advisory_xact_lock($1)', [2026072802]);
    const actual = (await sql.query(
      `SELECT id,email,active,bloqueado,token_version
       FROM usuarios WHERE id=ANY($1::uuid[]) ORDER BY id${apply ? ' FOR UPDATE' : ''}`,
      [ids],
    )).rows;
    if (actual.length !== expected.length) throw new Error('identidad allowlisted ausente');
    for (const item of expected) {
      const row = actual.find(({ id }) => id === item.id);
      if (!row || row.email.toLowerCase() !== item.email) {
        throw new Error('identidad allowlisted ambigua');
      }
    }
    if (!apply) return { matched: actual.length, changed: 0 };
    await sql.query(
      `UPDATE usuarios SET active=false,bloqueado=true,
        bloqueado_motivo='Cuenta sintética autorizada — PR20',
        bloqueado_en=now(),token_version=token_version+1
       WHERE id=ANY($1::uuid[])`,
      [ids],
    );
    await sql.query('DELETE FROM two_factor_challenges WHERE usuario_id=ANY($1::uuid[])', [ids]);
    await sql.query('DELETE FROM two_factor_recovery_codes WHERE usuario_id=ANY($1::uuid[])', [ids]);
    await sql.query('DELETE FROM password_reset_tokens WHERE usuario_id=ANY($1::uuid[])', [ids]);
    await sql.query('UPDATE two_factor_secrets SET habilitado=false WHERE usuario_id=ANY($1::uuid[])', [ids]);
    await sql.query(
      `UPDATE enlaces_magicos SET revocado_en=now(),
        revocado_motivo='Cuenta creadora neutralizada — PR20'
       WHERE creado_por=ANY($1::uuid[]) AND revocado_en IS NULL`,
      [ids],
    );
    await sql.query(
      `INSERT INTO auditoria_eventos(usuario_id,accion,recurso,recurso_id,metadata,exito,mensaje)
       SELECT id,'usuario_updated','usuarios',id::text,
         '{"operation":"pr20_synthetic_neutralization"}'::jsonb,true,
         'Cuenta sintética autorizada neutralizada'
       FROM unnest($1::uuid[]) AS ids(id)`,
      [ids],
    );
    await sql.query('COMMIT');
    return { matched: actual.length, changed: actual.length };
  } catch (error) {
    if (apply) await sql.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL requerida');
  if (!process.env.SYNTHETIC_USER_ALLOWLIST) throw new Error('SYNTHETIC_USER_ALLOWLIST requerida');
  const allowlist = JSON.parse(readFileSync(process.env.SYNTHETIC_USER_ALLOWLIST, 'utf8'));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    const identity = (await pool.query(
      `SELECT current_database() database,current_setting('neon.branch_id',true) branch_id`,
    )).rows[0];
    const productionBranch = process.env.NEON_PRODUCTION_BRANCH_ID;
    if (!productionBranch || !identity.branch_id) throw new Error('branch_id no verificable');
    const apply = process.env.DISABLE_SYNTHETIC_USERS === 'true';
    if (apply && identity.branch_id === productionBranch &&
        process.env.PRODUCTION_NEUTRALIZATION_CONFIRMATION !== 'PR20_AUTHORIZED_ALLOWLIST') {
      throw new Error('confirmación productiva ausente');
    }
    const result = await neutralizeAccounts(pool, allowlist, { apply });
    console.log(JSON.stringify({
      mode: apply ? 'APPLY' : 'DRY_RUN',
      database: identity.database,
      matched: result.matched,
      changed: result.changed,
    }));
  } finally {
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Neutralización abortada: ${error.message}`);
    process.exitCode = 1;
  });
}
