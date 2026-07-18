#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

const required = [
  'DATABASE_URL',
  'E2E_NEON_BRANCH_NAME',
  'E2E_NEON_BRANCH_ID',
  'E2E_NEON_ENDPOINT_ID',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Falta ${name}`);
}

const url = new URL(process.env.DATABASE_URL);
const host = url.hostname.toLowerCase();
const database = url.pathname.replace(/^\//, '');
const endpoint = host.split('.')[0].replace(/-pooler$/, '');
const expectedEndpoint = process.env.E2E_NEON_ENDPOINT_ID;
const productionEndpoint = process.env.E2E_NEON_PRODUCTION_ENDPOINT_ID || '';

if (!host.endsWith('.neon.tech')) throw new Error('El host no pertenece a Neon');
if (endpoint !== expectedEndpoint) throw new Error('El endpoint no coincide con la rama autorizada');
if (productionEndpoint && endpoint === productionEndpoint) throw new Error('El endpoint coincide con producción');
if (!/^fase1-validation-\d{6}$/.test(process.env.E2E_NEON_BRANCH_NAME)) {
  throw new Error('Nombre de rama de validación inesperado');
}
if (!/^br-[a-z0-9-]+$/.test(process.env.E2E_NEON_BRANCH_ID)) {
  throw new Error('Branch ID inválido');
}

const sql = neon(process.env.DATABASE_URL);
const metadata = await sql`
  select
    current_database() as database,
    current_setting('neon.branch_id', true) as branch_id,
    current_setting('neon.project_id', true) as project_id
`;

const reportedBranch = metadata[0]?.branch_id || null;
if (reportedBranch && reportedBranch !== process.env.E2E_NEON_BRANCH_ID) {
  throw new Error('PostgreSQL reporta un branch ID distinto');
}

if (process.argv.includes('--write-probe')) {
  const [, , rows] = await sql.transaction((tx) => [
    tx`create temporary table fase1_isolation_probe (id integer primary key)`,
    tx`insert into fase1_isolation_probe (id) values (1)`,
    tx`select count(*)::int as count from fase1_isolation_probe`,
    tx`drop table fase1_isolation_probe`,
  ]);
  if (rows[0]?.count !== 1) throw new Error('La prueba temporal de escritura falló');
}

console.log(JSON.stringify({
  ok: true,
  branchName: process.env.E2E_NEON_BRANCH_NAME,
  branchId: process.env.E2E_NEON_BRANCH_ID,
  endpoint,
  host,
  database,
  reportedBranch,
  projectIdAvailable: Boolean(metadata[0]?.project_id),
  writeProbe: process.argv.includes('--write-probe'),
}));
