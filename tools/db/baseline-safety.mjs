import { createHash, timingSafeEqual } from 'node:crypto';

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function signPlan(plan) {
  const unsigned = { ...plan };
  delete unsigned.signature;
  return createHash('sha256').update(stableJson(unsigned)).digest('hex');
}

export function verifyPlan(plan, context) {
  const failures = [];
  const actualSignature = signPlan(plan);
  const expected = Buffer.from(String(plan.signature ?? ''), 'utf8');
  const actual = Buffer.from(actualSignature, 'utf8');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) failures.push('plan_signature');
  if (plan.head !== context.head) failures.push('head');
  if (plan.branchId !== context.branchId) failures.push('branch');
  if (plan.database !== context.database) failures.push('database');
  if (plan.inventoryFingerprint !== context.inventoryFingerprint) failures.push('inventory');
  if (plan.equivalence !== 'EQUIVALENTE') failures.push('equivalence');
  return failures;
}

export async function beginLockedTransaction(sql, lockId) {
  await sql.query('BEGIN');
  await sql.query('SELECT pg_advisory_xact_lock($1)', [lockId]);
}

export async function insertExactTracking(sql, tracking) {
  for (const row of tracking.drizzle.rows) {
    await sql.query(
      'INSERT INTO drizzle.__drizzle_migrations(hash, created_at) VALUES($1,$2)',
      [row.hash, row.created_at],
    );
  }
  for (const row of tracking.manual.rows) {
    await sql.query(
      `INSERT INTO sgie_schema_migrations(name,hash,rows_affected,applied_at)
       VALUES($1,$2,$3,$4)`,
      [row.name, row.hash, row.rows_affected, row.applied_at],
    );
  }
}
