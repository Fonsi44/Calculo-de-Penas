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

export function validateCanonicalExport(canonical, seedTables, expectedTracking = { drizzle: 39, manual: 20 }) {
  const failures = [];
  if (canonical?.formatVersion !== 3) failures.push('format_version');
  if (canonical?.tracking?.drizzle?.count !== expectedTracking.drizzle) failures.push('drizzle_tracking');
  if (canonical?.tracking?.manual?.count !== expectedTracking.manual) failures.push('manual_tracking');
  for (const table of seedTables) {
    const fingerprint = canonical?.seeds?.[table];
    if (
      !fingerprint
      || (fingerprint.status !== 'NO_APLICABLE'
        && (!Number.isInteger(fingerprint.count) || !/^[a-f0-9]{64}$/.test(fingerprint.sha256 ?? '')))
    ) {
      failures.push(`seed_fingerprint:${table}`);
    }
  }
  if (!canonical?.seedContracts || typeof canonical.seedContracts !== 'object') {
    failures.push('seed_contracts');
  }
  return failures;
}

export function compareRequiredSubset(requiredRows, candidateRows, naturalKey) {
  const keyOf = (row) => naturalKey.map((field) => JSON.stringify(row[field] ?? null)).join('|');
  const candidateByKey = new Map(candidateRows.map((row) => [keyOf(row), row]));
  const missing = [];
  const conflicts = [];
  for (const required of requiredRows) {
    const key = keyOf(required);
    const candidate = candidateByKey.get(key);
    if (!candidate) {
      missing.push(key);
    } else if (stableJson(candidate) !== stableJson(required)) {
      conflicts.push(key);
    }
  }
  return {
    status: missing.length === 0 && conflicts.length === 0 ? 'EQUIVALENTE_SUBSET' : 'DIVERGENTE_CONTRACTUAL',
    required: requiredRows.length,
    candidate: candidateRows.length,
    missing,
    conflicts,
  };
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
