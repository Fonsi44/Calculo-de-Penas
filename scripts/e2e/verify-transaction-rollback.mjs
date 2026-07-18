#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

if (process.env.ALLOW_TEST_DATABASE !== 'true' || process.env.E2E_ENV !== 'staging') {
  throw new Error('Guardas E2E incompletas');
}
const sql = neon(process.env.DATABASE_URL);
let failed = false;
try {
  await sql.transaction((tx) => [
    tx`create table fase1_rollback_probe (id integer primary key)`,
    tx`insert into fase1_rollback_probe (id) values (1)`,
    tx`insert into fase1_rollback_probe (id) values (1)`,
  ], { isolationLevel: 'Serializable' });
} catch {
  failed = true;
}
if (!failed) throw new Error('La transacción de prueba debía fallar');
const state = await sql`
  select to_regclass('public.fase1_rollback_probe') is null as rolled_back
`;
if (!state[0]?.rolled_back) throw new Error('La tabla de prueba sobrevivió al rollback');
console.log(JSON.stringify({ ok: true, rollback: 'complete', persistentArtifacts: 0 }));
